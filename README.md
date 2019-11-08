Cobweb
======

Cobweb is a web request handling framework for NodeJS designed to:

* play well with TypeScript,
* obviate the need for side-effects in middleware,
* narrow the area in which the response to the client can be effected.

Design Philosophy:

* Doing things better is prefered over doing more things.
* New features must pass trial by YAGNI.
* Composability is prefered over configurability.
* It is better to facilitate built in libraries than to attempt their re-design.

Install
-------

TODO

Tutorial
--------

### Basic example

```ts
import { Cobweb } from "cobweb";
import * as http from "http";

const cobweb = new Cobweb({});
cobweb.addEndpoint({
    when: req => req.url === "/hello",
    do: (req, res) => {
        res.write("hello world");
        res.end();
    }
});

http.createServer(cobweb);
```

### Endpoints

A request will be handled by the first Endpoint with a matching condition. These are created using `cobweb.addEndpoint(...)`. Endpoints are the only place where the response object can be handled. Cobweb in no way effects the request or response object.

```ts
cobweb.addEndpoint({
    when: req => req.url === "/hello/world",
    do: (req, res) => {
        res.end("hello world");
    }
});
cobweb.addEndpoint({
    when: req => req.url.startsWith("/hello"),
    do: (req, res) => {
        res.end("hello");
    }
});
```

In this example a request to the url "/hello/world", matches the condition of both endpoints, however only the first endpoint is called, sending "hello world" to the user.

### The Default Endpoint

If no endpoint matches, a default Endpoint can be used, if one has been set with `cobweb.setNoEndpointHandler(...)`;

```ts
handler.setNoEndpointHandler((req, res) => {
    res.statusCode = 404;
    res.end("404 Not Found");
});
```

### Observers

A request will be handled by all Observers with a matching condition. These are created using `cobweb.addObserver(...)`. The response object is not accessible here.

```ts
cobweb.addObserver({
    when: req => req.url === "/hello",
    do: (req) => {
        console.log(req.connection.remoteAddress);
    }
});
```
