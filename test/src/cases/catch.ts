import { quelaag, Router } from "../../../src";
import { makeRequest, Test } from "../framework";
import { IncomingMessage, ServerResponse } from "http";

export const catchTests: Test[] = [{
    name: "A thrown exception in `when` should be caught.",
    run({ fail, test }) {
        const handler = new Router(quelaag({}));
        handler.addEndpoint({
            when: () => {
                throw "error1"
            },
            do: () => {},
            catch: (err) => {
                test(err === "error1");
            }
        });
        handler.addEndpoint({
            when: () => {
                throw "error2";
            },
            do: () => {},
            catch: () => {
                fail();
            }
        });

        makeRequest(handler);
    }
},
{
    name: "A thrown exception in `do` should be caught.",
    run({ fail, test }) {
        const handler = new Router(quelaag({}));
        handler.addEndpoint({
            when: () => false,
            do: () => {
                throw "error1";
            },
            catch: () => {
                fail();
            }
        });
        handler.addEndpoint({
            when: () => true,
            do: () => {
                throw "error2";
            },
            catch: (err) => {
                test(err === "error2");
            }
        });

        makeRequest(handler);
    }
},
{
    name: "A rejected promise in `when` should be caught.",
    run({ fail, test }) {
        const handler = new Router(quelaag({}));
        handler.addEndpoint({
            when: () => false,
            do: () => {},
            catch: () => {
                fail();
            },
        });
        handler.addEndpoint({
            when: () => Promise.reject("error2"),
            do: () => {},
            catch: (err) => {
                test(err === "error2");
            }
        });

        makeRequest(handler);
    }
},
{
    name: "A rejected promise in `do` should be caught.",
    run({ fail, test }) {
        const handler = new Router(quelaag({}));
        handler.addEndpoint({
            when: () => false,
            do: () => Promise.reject("error1"),
            catch: () => {
                fail();
            },
        });
        handler.addEndpoint({
            when: () => true,
            do: () => Promise.reject("error2"),
            catch: (err) => {
                test(err === "error2");
            }
        });

        makeRequest(handler);
    }
},
{
    name: "A thrown exception in fallback handler should be caught.",
    run({ pass }) {
        const handler = new Router(quelaag({}));
        handler.setFallbackEndpoint({
            do: () => {
                throw "error1";
            },
            catch: () => {
                pass();
            }
        });

        makeRequest(handler);
    }
},
{
    name: "A rejected promise in fallback handler should be caught.",
    run({ pass }) {
        const handler = new Router(quelaag({}));
        handler.setFallbackEndpoint({
            do: () => Promise.reject("error1"),
            catch: () => {
                pass();
            },
        });

        makeRequest(handler);
    }
},
{
    name: "A caught endpoint should have an error message, request, and response.",
    run({ test }) {
        const handler = new Router(quelaag({}));
        handler.addEndpoint({
            when: () => true,
            do: () => {
                throw "error";
            },
            catch: (err, req, res) => {
                test(err === "error");
                test(req instanceof IncomingMessage);
                test(res instanceof ServerResponse);
            }
        });

        makeRequest(handler);
    }
}, {
    name: "A caught spy should have an error message and request.",
    run({ test }) {
        const handler = new Router(quelaag({}));
        handler.addSpy({
            when: () => true,
            do: () => {
                throw "error";
            },
            catch: (err, req) => {
                test(err === "error");
                test(req instanceof IncomingMessage);
            }
        });

        makeRequest(handler);
    }
}];
