import { Quelaag } from "../../../src";
import { makeRequest, Test } from "../framework";

export const errorTests: Test[] = [{
    name: "An uncaught exception thrown in `when` should be catchable .",
    run({ test }) {
        const handler = new Quelaag({}, err => test(err === "error"));
        handler.addEndpoint({
            when: () => {
                throw "error"
            },
            do: () => {},
        });

        makeRequest(handler);
    }
},
{
    name: "An uncaught exception thrown in `do` should be catchable .",
    run({ test }) {
        const handler = new Quelaag({}, err => test(err === "error"));
        handler.addEndpoint({
            when: () => true,
            do: () => {
                throw "error";
            },
        });

        makeRequest(handler);
    }
},
{
    name: "An uncaught exception thrown in `catch` should be catchable .",
    run({ test }) {
        const handler = new Quelaag({}, err => test(err === "error"));
        handler.addEndpoint({
            when: () => true,
            do: () => {
                throw "errorForEndpointCatch";
            },
            catch: () => {
                throw "error";
            },
        });

        makeRequest(handler);
    }
},
{
    name: "An uncaught exception thrown in `middleware` should be catchable .",
    run({ test }) {
        const handler = new Quelaag({}, err => test(err === "error"));
        handler.addEndpoint({
            when: () => {
                throw "error";
            },
            do: () => {},
        });

        makeRequest(handler);
    }
},];
