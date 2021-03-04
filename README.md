# Quelaag

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

## Basic Example

```ts
import { quelaag, Router } from "quelaag";
import * as http from "http";

const router = new Router(quelaag({}));
router.addEndpoint({
    when: req => req.url === "/hello",
    do: (req, res) => {
        res.write("hello world");
        res.end();
    }
});

const server = http.createServer((req, res) => router.handle(req, res));
server.listen(8080);
```

`quelaag` is a function that creates memoised middleware functions. In this example there are no middleware functions. `Router` is a class that facilitates choosing what to do when handling an incoming request.

`quelaag` and `Router` are designed to be flexible in how they can be used. You can use them with NodeJS's built-in libraries or a third-party framework. `quelaag` can be used without `Router` entirely.

By default, the type of requests and responses are NodeJS's `IncomingMessage` and `ServerResponse`. However, these can be overridden with type arguments to `quelaag` or `Router`.

```ts
import { quelaag, Router } from "quelaag";
import * as express from "express";

const router = new Router<express.Request, express.Response>(quelaag({}));
router.addEndpoint({
    when: req => req.ip.endsWith("127.0.0.1"),
    do: (req, res, middleware) => {
        res.json({ hello: "world" });
    }
});

const app = express();
app.use((req, res, next) => {
    router.handle(req, res);
    next();
});
app.listen(8081);
```

## Middleware

Middleware are functions that are given the request object and return some type. Yes, that includes Promises. Middleware are always called explicitly. Middleware calls are memoised meaning that for a single request, each middleware function will compute its return value no more than once.

A middleware specification, containing an object of functions, is given to the `quelaag` function. These methods should take the request object, but the memoised methods do not take the request object.

### Memoisation

```ts
import { quelaag } from "quelaag";

const makeMiddleware = quelaag({
    ip(req): string {
        console.log("ip");
        return req.connection.remoteAddress;
    },
    isMe(req): boolean {
        return this.ip(req) === "127.0.0.1";
    }
});

let req1, req2; // Imagine you got some request objects from somewhere.

const request1 = makeMiddleware(req1);
const request2 = makeMiddleware(req2);
const request1Again = makeMiddleware(req1);

request1.ip();   // prints "ip", returns "127.0.0.1"
request1.ip();   //              returns "127.0.0.1"
request1.isMe(); //              returns true

request2.isMe(); // prints "ip", returns true
request2.ip();   //              returns "127.0.0.1"
request2.ip();   //              returns "127.0.0.1"

request1Again.ip(); // prints "ip", returns "127.0.0.1"
```

In order for middleware to call each other, arrow syntax can't be used by the caller in order for `this` to refer to the middleware specification object. The `noImplicitThis` option in your tsconfig needs to be enabled for the type checking on `this` to be correct.

### Full Example

The router that comes with `quelaag` creates new middleware objects for you.

A middleware instance is passed as the last parameter to each of each callback in each of `addEndpoint`, `setFallbackEndpoint`, `addSpy`.

```ts
import { quelaag, Router } from "quelaag";
import * as cookie from "cookie"; // a third party cookie header parsing library
import * as http from "http";

const router = new Router(quelaag({
    cookies(req) {
        return cookie.parse(req.headers.cookie || '');
    },
    userId(req) {
        return parseInt(this.cookies(req).userId);
    },
    async userIsAdministrator(req) {
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

const server = http.createServer((req, res) => router.handle(req, res));
server.listen(8080);
```

## Routing

### Endpoints

A request will be handled by the first Endpoint with a matching condition. These are created using `quelaag.addEndpoint(...)`. Endpoints are the only place where the response object can be handled. Quelaag in no way affects the request or response object.

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
        console.log(req.connection.remoteAddress);
    }
});
```

### Error handling

An error thrown or a promise rejected in a `when` or `do` can be caught with an optional `catch` function on any Endpoint or Spy.

A catch handler can also be given to Quelaag, as a fallback for when a local `catch` is not defined.

```ts
import { quelaag, Router } from "quelaag";
const router = new Router(
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

## TypeScript Troubles

TypeScript is a fantastic language with often impressive type inference. [However it isn't always perfect and in situations where there is a lot that can be inferred, TypeScript may be too permissive.](https://github.com/microsoft/TypeScript/issues/34858#issuecomment-577932912)

### Missing parameter allowed

In the examples below, each call to `this.number` should take `req` for Quelaag to function correctly. However the exclusion of a return type in the method signature affects whether TypeScript will allow it.

```ts
quelaag({
    number(req) {
        return 100;
    },

    isEven1(req) {
        this.number() % 2 == 0;        // error
        return this.number() % 2 == 0; // compiles
    },
    isEven2(req): boolean {
        this.number() % 2 == 0;        // error
        return this.number() % 2 == 0; // error
    },
});
```

### No implicit this

To get the a greater benefit from TypeScript's type inference, you should enable `noImplicitThis` in your tsconfig.json. It causes `this` in your middleware specification to be correctly typed instead of treated as `any`.
