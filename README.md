Quelaag
======

Quelaag is a web request handling framework for NodeJS designed to:

* play well with TypeScript,
* obviate the need for side-effects in middleware,
* narrow the area in which the response to the client can be affected.

Design Philosophy:

* Doing things better is preferred over doing more things.
* New features must pass trial by YAGNI.
* Composability is preferred over configurability.
* It is better to facilitate built in libraries than to attempt their re-design.

The API is still subject to change.

Install
-------

```
npm install --save quelaag
```

Tutorial
--------

### Basic example

```ts
import { Quelaag } from "quelaag";
import * as http from "http";

const quelaag = new Quelaag({});
quelaag.addEndpoint({
    when: req => req.url === "/hello",
    do: (req, res) => {
        res.write("hello world");
        res.end();
    }
});

const server = http.createServer((req, res) => quelaag.handle(req, res));
server.listen(8080);
```

Quelaag's handle method is versatile. It can be used anywhere you might want an incoming request handler, even inside other frameworks.

By default, the type of requests and responses are that of NodeJS's `IncomingMessage` and `ServerResponse`. However these can be overridden with type arguments to `Quelaag`.

```ts
import { Quelaag } from "quelaag";
import * as express from "express";
const quelaag = new Quelaag<express.Request, express.Response>({});
quelaag.addEndpoint({
    when: req => req.ip.endsWith("127.0.0.1"),
    do: (req, res, middleware) => {
        res.json({ hello: "world" });
    }
});
const app = express();
app.use((req, res, next) => {
    quelaag.handle(req, res);
    next();
});
app.listen(8081);
```

### Endpoints

A request will be handled by the first Endpoint with a matching condition. These are created using `quelaag.addEndpoint(...)`. Endpoints are the only place where the response object can be handled. Quelaag in no way affects the request or response object.

```ts
quelaag.addEndpoint({
    when: req => req.url === "/hello/world",
    do: (req, res) => {
        res.end("hello world");
    }
});
quelaag.addEndpoint({
    when: req => req.url.startsWith("/hello"),
    do: (req, res) => {
        res.end("hello");
    }
});
```

In this example, a request to "/hello/world" is matched by the condition of both endpoints, however only the first endpoint is called, sending "hello world" to the user.

### The Fallback Endpoint

If no endpoint matches, a default can be used, if one has been set with `quelaag.setFallbackEndpoint(...)`;

```ts
quelaag.setFallbackEndpoint((req, res) => {
    res.statusCode = 404;
    res.end("404 Not Found");
});
```

### Spies

A request will be handled by all Spies with a matching condition. These are created using `quelaag.addSpy(...)`. The response object is not accessible here.

```ts
quelaag.addSpy({
    when: req => req.url === "/hello",
    do: (req) => {
        console.log(req.connection.remoteAddress);
    }
});
```

### Middleware

Middleware are functions that are given the request object and return some type. Yes, that includes Promises. Middleware are manually called from any Spy or Endpoint. Middleware calls are memoised meaning that for a single request, each middleware return value will be computed no more than once.

A middleware specification is given to the Quelaag constructor. The specification is an object of functions. Each function must take a request. The type of each function can be inferred and used in request handlers.

The object containing all middleware is passed as the last parameter to each of `addEndpoint`, `setFallbackEndpoint`, `addSpy`. Here, middleware functions do not need to take the request as an argument. Quelaag in effect applies the request object to the middleware function.

However in the middleware specification, they should be passed an argument. In order for middleware to call each other, arrow syntax can't be used by the caller in order for `this` to refer to the middleware specification object.

```ts
import { Quelaag } from "quelaag";
import * as cookie from "cookie"; // a third party cookie header parsing library
import * as http from "http";

const quelaag = new Quelaag({
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
});
quelaag.addEndpoint({
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

const server = http.createServer((req, res) => quelaag.handle(req, res));
server.listen(8080);
```

TypeScript Troubles
-------------------

TypeScript is a fantastic language with often impressive type inference. [However it isn't always perfect and in situations where there is a lot that can be inferred, TypeScript may be too permissive.](https://github.com/microsoft/TypeScript/issues/34858#issuecomment-577932912)

### Missing parameter allowed

In the examples below, each call to `this.number` should take `req` for Quelaag to function correctly. However the exclusion of a return type in the method signature affects whether TypeScript will allow it.

```ts
new Quelaag({
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

### No implicit any

To get the a greater benefit from TypeScript's type inference, you should enable `noImplicitThis` in your tsconfig.json. It causes `this` in your middleware specification to be correctly typed instead of treated as `any`.
