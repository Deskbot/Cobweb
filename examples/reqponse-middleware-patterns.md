Quelaag as a package is only concerned with request middleware, and so there is no required way to do response middleware. My only real suggestion is to be explicit about what middleware is being applied.

Most response middleware can be implemented as a simple function call on an endpoint by endpoint basis, however it gets more complicated when you want middleware to affect the control flow (for example to take over from the endpoint and finish processing the response early).

# Possible Patterns

The following examples are for a scenario where a user of a messaging platform wants to delete their message. We have to validate that the user is logged in and that they own the message they're trying to delete.

Functions used in these examples:

(This was written without Quelaag in mind, so presumably `getUser` and `getRequest` are done with Quelaag, and `deleteMessageEndpoint` is referenced in some kind of router.)

```ts
declare getUser(req: IncomingRequest): User
declare getMessage(req: IncomingRequest): Message

interface User {
    // returns whether the given user is logged in
    isLoggedIn(): boolean;
    // returns whether the given user owns the given message
    owns(message: Message): boolean;
}

interface Message {
    delete(): void;
}

function json(res, object) {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 200;
    res.write(JSON.stringify(object));
    res.end();
}
```

## 1. Return a bool for whether to continue

```js
function mustBeLoggedIn(res, user) {
    if (!user.isLoggedIn()) {
        res.statusCode = 403;
        res.end();

        return true;
    }

    return false;
}

function mustOwnMessage(res, user, message) {
    if (!user.owns(message)) {
        res.statusCode = 403;
        res.end();

        return true;
    }

    return false;
}

function deleteMessageEndpoint(req, res) {
    const user = getUser(req);
    const message = getMessage(req);

    if (mustBeLoggedIn(res, user)) {
        return;
    }

    if (mustOwnMessage(res, user, message)) {
        return;
    }

    message.delete();
    json(res, { message: "OK" })
}
```

## 2. Rely on res.writeEnded

```js
function mustBeLoggedIn(res, user) {
    if (!user.isLoggedIn()) {
        res.statusCode = 403;
        res.end();
    }
}

function mustOwnMessage(res, user, message) {
    if (!user.owns(message)) {
        res.statusCode = 403;
        res.end();
    }
}

function deleteMessageEndpoint(req, res) {
    const user = getUser(req);
    const message = getMessage(req);

    mustBeLoggedIn(res, user);
    if (res.writeEnded) {
        return;
    }

    mustOwnMessage(res, user, message);
    if (res.writeEnded) {
        return;
    }

    message.delete();
    json(res, { message: "OK" })
}
```

## 3. Order explicitly with "next" parameters

```js
function mustBeLoggedIn(res, user, next) {
    if (!user.isLoggedIn()) {
        res.statusCode = 403;
        res.end();
    }

    next();
}

function mustOwnMessage(res, user, message, next) {
    if (!user.owns(message)) {
        res.statusCode = 403;
        res.end();
    }

    next();
}

function deleteMessageEndpoint(req, res) {
    const user = getUser(req);
    const message = getMessage(req);

    const third = () => {
        message.delete();
        json(res, { message: "OK" })
    }
    const second = () => mustOwnMessage(res, user, message, third);
    const first = () => mustBeLoggedIn(res, user, second);

    first();
}
```

## 4. Order automatically with "next" parameters

```js
function mustBeLoggedIn(res, user, next) {
    if (!user.isLoggedIn()) {
        res.statusCode = 403;
        res.end();
    }

    next();
}

function mustOwnMessage(res, user, message, next) {
    if (!user.owns(message)) {
        res.statusCode = 403;
        res.end();
    }

    next();
}

function callInOrder(arr) {
    let i = -1;

    function callNext() {
        i++;

        if (i < arr.length) {
            arr[i](callNext);
        }
    }

    callNext();
}

function deleteMessageEndpoint(req, res) {
    const user = getUser(req);
    const message = getMessage(req);

    const responseMiddleware = [
        next => mustBeLoggedIn(res, user, next),
        next => mustOwnMessage(res, user, message, next),
        next => {
            message.delete();
            json(res, { message: "OK" });
        }
    ];

    callInOrder(responseMiddleware);
}
```

## 5. Order automatically using the return value

```js
function mustBeLoggedIn(res, user) {
    if (!user.isLoggedIn()) {
        res.statusCode = 403;
        res.end();

        return true;
    }

    return false;
}

function mustOwnMessage(res, user, message) {
    if (!user.owns(message)) {
        res.statusCode = 403;
        res.end();

        return true;
    }

    return false;
}

function callInOrder(arr) {
    let i = -1;

    function callNext() {
        i++;

        if (i < arr.length && !arr[i]()) {
            callNext();
        }
    }

    callNext();
}

function deleteMessageEndpoint(req, res) {
    const user = getUser(req);
    const message = getMessage(req);

    const responseMiddleware = [
        () => mustBeLoggedIn(res, user),
        () => mustOwnMessage(res, user, message),
        () => {
            message.delete();
            json(res, { message: "OK" });
        }
    ];

    callInOrder(responseMiddleware);
}
```
