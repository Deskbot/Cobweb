# Quelaag

Named after the spider boss from Dark Souls. Typically Pronounced: (/ˈkweɪlæɡ/) (like a combination of "quail" and "lag")

Quelaag is a web request handling library for NodeJS designed to:

* play well with TypeScript,
* avoid applying side-effects to the request object,
* manage dependencies between middleware easily,
* make code paths explicit for straight-forward debugging.

Design Philosophy:

* Doing things better is preferred over doing more things.
* New features must pass trial by YAGNI.
* Composability is preferred over configurability.
* It is better to facilitate built-in libraries than to attempt their re-design.

The API is still subject to change.

## Install

```
npm install --save quelaag
```

## "Hello World" Example

```ts
import { quelaag, router } from "quelaag";
import * as http from "http";

const root = router(quelaag({
    cookies(req: express.Request): Record<string, string> {
        return cookie.parse(req.headers.cookie || "");
    }
}));
root.addEndpoint({
    when: req => req.url! === "/hello",
    do: (req, res) => {
        if (middleware.cookies().loggedIn) {
            res.write("hello world");
        }
        res.end();
    }
});

const server = http.createServer((req, res) => root.route(req, res));
server.listen(8080);
```

`quelaag` is a function that creates memoised middleware functions, e.g. `cookies` in the above example. `router` creates an object that facilitates choosing what to do when handling an incoming request.

`quelaag` and `router` are designed to be flexible in how they can be used. You can use them with NodeJS's built-in libraries or a third-party framework. `quelaag` can be used without `router` entirely.

By default, the type of requests and responses are NodeJS's `IncomingMessage` and `ServerResponse`. However, these can be overridden with type arguments to `router`.

```ts
import { quelaag, router } from "quelaag";
import * as cookie from "cookie"; // a third party cookie header parsing library
import * as express from "express";

const q = quelaag({
    cookies(req: express.Request): Record<string, string> {
        return cookie.parse(req.headers.cookie || "");
    }
});

const root = router<express.Request, express.Response, typeof q>(q);
root.addEndpoint({
    when: req => req.ip.endsWith("127.0.0.1"),
    do: (req, res, middleware) => {
        if (middleware.cookies().loggedIn) {
            res.json({ hello: "world" });
        }
    }
});

const app = express();
app.use((req, res, next) => {
    root.route(req, res);
    next();
});
app.listen(8081);

```

## Middleware

Middleware are functions that are given the request object and return some type. Yes, that includes Promises. Middleware are always called explicitly. Middleware calls are memoised meaning that for a single request, each middleware function will compute its return value no more than once.

### Memoisation

Example of what `quelaag` does by using it in isolation.

```ts
import { quelaag } from "quelaag";

const makeMiddleware = quelaag({
    ip(req): string {
        console.log("ip");
        return req.socket.remoteAddress;
    },
    isMe(req): boolean {
        return this.ip(req) === "127.0.0.1";
    }
});

let req1, req2; // Imagine you got some request objects from somewhere.

const request1 =      makeMiddleware(req1, undefined); // ignore the use of undefined here for now
const request2 =      makeMiddleware(req2, undefined);
const request1Again = makeMiddleware(req1, undefined);

request1.ip();   // prints "ip", returns "127.0.0.1"
request1.ip();   //              returns "127.0.0.1"
request1.isMe(); //              returns true

request2.isMe(); // prints "ip", returns true
request2.ip();   //              returns "127.0.0.1"
request2.ip();   //              returns "127.0.0.1"

request1Again.ip(); // prints "ip", returns "127.0.0.1"
```

Notice that a method in the middleware specification given to `quelaag` takes the request object, but the memoised version called later does not.

In order for middleware to call each other, the function can't be defined with arrow syntax, so that `this` inside the function refers to the middleware object. The `noImplicitThis` option in your tsconfig needs to be enabled for the type checking on `this` to be correct.

## Proper Example

`Router` creates new middleware instances for you, which are passed as the last parameter to all of `Router`'s callbacks.

```ts
import { quelaag, router } from "quelaag";
import * as cookie from "cookie"; // a third party cookie header parsing library
import * as http from "http";

const router = router(quelaag({
    cookies(req): Record<string, string> {
        return cookie.parse(req.headers.cookie || "");
    },
    userId(req): number {
        return parseInt(this.cookies(req).userId);
    },
    async userIsAdministrator(req): Promise<boolean> {
        const user = await getUserFromDatabase(this.userId(req));
        return user.isAdmin;
    }
}));

router.addEndpoint({
    when: req => req.url === "/admin",
    do: async (req, res, middleware) => {
        if (await middleware.userIsAdministrator()) {
            res.end("Greetings planet.");
        } else {
            res.statusCode = 403;
            res.end("403 Forbidden");
        }
    }
});

const server = http.createServer((req, res) => router.route(req, res));
server.listen(8080);
```

## Routing

### Endpoints

A request will be handled by the first Endpoint with a matching condition. These are created using `router.addEndpoint(...)`. Endpoints are the only place where the response object can be handled. `Router` and `quelaag` in no way affect the request or response object.

```ts
router.addEndpoint({
    when: req => req.url === "/hello/world",
    do: (req, res) => {
        res.end("hello world");
    }
});
router.addEndpoint({
    when: req => req.url.startsWith("/hello"),
    do: (req, res) => {
        res.end("hello");
    }
});
```

In this example, a request to "/hello/world" is matched by the condition of both endpoints, however only the first endpoint is called, sending "hello world" to the user.

### The Fallback Endpoint

If no endpoint matches, a default can be used, if one has been set with `router.setFallbackEndpoint(...)`;

```ts
router.setFallbackEndpoint((req, res) => {
    res.statusCode = 404;
    res.end("404 Not Found");
});
```

### Spies

A request will be handled by all Spies with a matching condition. These are created using `router.addSpy(...)`. The response object is not accessible here.

```ts
router.addSpy({
    when: req => req.url === "/hello",
    do: (req) => {
        console.log(req.socket.remoteAddress);
    }
});
```

### Error handling

An error thrown or a promise rejected in a `when` or `do` can be caught with an optional `catch` function on any Endpoint or Spy.

A catch handler can also be given to Quelaag, as a fallback for when a local `catch` is not defined.

```ts
import { quelaag, router } from "quelaag";

const router = router(
    quelaag({}),
    (err) => {
        console.error(err);
    }
);
router.addEndpoint({
    when: req => req.url === "/local/handle",
    do: (req, res, middleware) => {
        throw "will only be caught by the handler given to this Endpoint";
    },
    catch: (err) => {
        console.error(err);
    },
});
router.addEndpoint({
    when: req => req.url === "/quelaag/handle",
    do: (req, res, middleware) => {
        throw "will only be caught by the handler given to Quelaag";
    }
});
```

## Sub-Routing

This feature is designed to allow routing logic and middleware definitions to be split across multiple files.

```ts
// ./app.ts

import * as cookie from "cookie";
import { createServer, IncomingMessage } from "http";
import { router, quelaag } from "quelaag";
import { adminRouter } from "./admin";

export const root = router(quelaag({
    cookies(req) {
        return cookie.parse(req.headers.cookie || '');
    },
    userId(req): number {
        return parseInt(this.cookies(req).userId);
    },
    url(req: IncomingMessage): URL {
        return new URL(req.url!);
    },
}));

root.addSubRouter({
    when: (req, middleware) => middleware.url().pathname.startsWith("/admin"),
    router: () => adminRouter,
});

const server = createServer((req, res) => root.route(req, res));
server.listen(8080);

// ./admin.ts

import { subRouter } from "quelaag";
import { root } from "./app";

export const adminRouter = subRouter(
    root,
    {
        url(req, superMiddleware) {
            return superMiddleware.url();
        },
        async userIsAdministrator(req, superMiddleware): Promise<boolean> {
            const user = await getUserFromDatabase(superMiddleware.userId());
            return user.isAdmin;
        }
    }
);

adminRouter.addEndpoint({
    when: (req, middleware) => middleware.url().pathname.startsWith("/admin"),
    do: async (req, res, middleware) => {
        if (await middleware.userIsAdministrator()) {
            res.end("Greetings planet.");
        } else {
            res.statusCode = 403;
            res.end("403 Forbidden");
        }
    }
});
```

## Sub-Quelaags

A demonstration of how Quelaags definitions can be merged.

```ts
import { IncomingMessage } from "node:http";
import { quelaag, subquelaag } from "quelaag";

const makeParent = quelaag({
    ip(req: IncomingMessage): string {
        console.log("ip");
        return req.socket.remoteAddress;
    },
});

const makeMiddleware = subquelaag(
    makeParent,
    {
        ip(req, parentMiddleware): string {
            return parentMiddleware.ip();
        },
        isMe(req, parentMiddleware): boolean {
            return parentMiddleware.ip() === "127.0.0.1";
        }
    }
);

let req1: IncomingMessage, req2: IncomingMessage; // Imagine you got some request objects from somewhere.

const request1 =      makeMiddleware(req1, makeParent(req1, undefined));
const request2 =      makeMiddleware(req2, makeParent(req2, undefined));
const request1Again = makeMiddleware(req1, makeParent(req1, undefined));

request1.ip();   // prints "ip", returns "127.0.0.1"
request1.ip();   //              returns "127.0.0.1"
request1.isMe(); //              returns true

request2.isMe(); // prints "ip", returns true
request2.ip();   //              returns "127.0.0.1"
request2.ip();   //              returns "127.0.0.1"

request1Again.ip(); // prints "ip", returns "127.0.0.1"
```

In addition to the "request", a second parameter called the "context" can be passed to a middleware function. The main purpose of "context" is to allow middleware functions to use `Quelaag`s defined and initialised elsewhere. By default this is undefined and its type will be inferred from the type given in the middleware functions you define. The context can actually be any type allowing you to use multiple parent `Quelaags` if you wish. The methods on the parent(s) are not inherited by the child `Quelaag` any methods you want to inherit have to be defined explicitly. This is the easiest way to manage dependencies between sub-quelaags and sub-routers.

When using `router` and `subrouter`, the context is handled for you.

## TypeScript Troubles

TypeScript is a fantastic language with often impressive type inference. [However it isn't always perfect and in situations where there is a lot that can be inferred, TypeScript may be too permissive.](https://github.com/microsoft/TypeScript/issues/34858#issuecomment-577932912)

### No Implicit This

To get the a greater benefit from TypeScript's type inference, you should enable `noImplicitThis` in your tsconfig.json. It causes `this` in your middleware specification to be correctly typed instead of treated as `any`.

### Circular Type Inference

When defining middleware, the type of `this` is defined by the methods in the object, and the type of those methods can be affected by the type of `this`.

The circular type inference can cause scenarios where code compiles when it shouldn't or doesn't compile when it should.

This is solved by giving all methods a return type.

```ts
quelaag({
    number(req) {
        return 100;
    },

    // no return type
    isEven1(req) {
        this.number(req) % 2 == 0;        // compiles
        return this.number(req) % 2 == 0; // error
    },

    // return type is given
    isEven2(req): boolean {
        this.number(req) % 2 == 0;        // compiles
        return this.number(req) % 2 == 0; // compiles
    },
});
```

### Partial Application of Type Arguments

TypeScript only infers type parameters when none of them are present. If you omit a type argument that has a default, the default will be used, however the default might not the type you want.

It's possible that you will want to specify some types in a call to `quelaag`, `router` or many of the types provided with this package, but the nature of writing a middleware specification is that you'll have some very big object whose type you want to be inferred. The best solution — I think — is to specify all of the type arguments and use `typeof` to get the complicated object type that you are using. I think that is easier than using the work around of currying the type arguments (i.e. defining nested functions each of which takes a single type argument).

[In the future, there may be a way to tell TypeScript which types to infer.](https://github.com/microsoft/TypeScript/issues/26242)
