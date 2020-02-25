import { Quelaag } from "../../../src";
import { makeRequest, Test } from "../framework";

export const errorTests: Test[] = [{
    name: "An uncaught exception thrown in `when` in endpoint should be catchable .",
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
    name: "An uncaught exception thrown in `when` in spy should be catchable .",
    run({ test }) {
        const handler = new Quelaag({}, err => test(err === "error"));
        handler.addSpy({
            when: () => {
                throw "error"
            },
            do: () => {},
        });

        makeRequest(handler);
    }
},
{
    name: "An uncaught exception thrown in `do` in endpoint should be catchable .",
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
    name: "An uncaught exception thrown in `do` in spy should be catchable .",
    run({ test }) {
        const handler = new Quelaag({}, err => test(err === "error"));
        handler.addSpy({
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
