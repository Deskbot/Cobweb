import { Quelaag } from "../../../src";
import { makeRequest, Test } from "../framework";

export const catchTests: Test[] = [{
    name: "A thrown exception in `when` should be caught.",
    cases: 2,
    run({ test }) {
        const handler = new Quelaag({});
        handler.addEndpoint({
            when: () => {
                throw "error"
            },
            do: () => {},
            catch: (err) => {
                test(err === "error");
            }
        });
        handler.addEndpoint({
            when: () => {
                throw "error";
            },
            do: () => {},
            catch: (err) => {
                test(err === "error");
            }
        });

        makeRequest(handler);
    }
},
{
    name: "A thrown exception in `do` should be caught.",
    cases: 2,
    run({ test }) {
        const handler = new Quelaag({});
        handler.addEndpoint({
            when: () => true,
            do: () => {
                throw "error";
            },
            catch: (err) => {
                test(err === "error");
            }
        });
        handler.addEndpoint({
            when: () => true,
            do: () => {
                throw "error";
            },
            catch: (err) => {
                test(err === "error");
            }
        });

        makeRequest(handler);
    }
},
{
    name: "A rejected promise in `when` should be caught.",
    cases: 2,
    run({ test }) {
        const handler = new Quelaag({});
        handler.addEndpoint({
            when: () => Promise.reject("error"),
            do: () => {},
            catch: (err) => {
                test(err === "error");
            }
        });
        handler.addEndpoint({
            when: () => Promise.reject("error"),
            do: () => {},
            catch: (err) => {
                test(err === "error");
            }
        });

        makeRequest(handler);
    }
},
{
    name: "A rejected promise in `do` should be caught.",
    cases: 2,
    run({ test }) {
        const handler = new Quelaag({});
        handler.addEndpoint({
            when: () => true,
            do: () => Promise.reject("error"),
            catch: (err) => {
                test(err === "error");
            }
        });
        handler.addEndpoint({
            when: () => true,
            do: () => Promise.reject("error"),
            catch: (err) => {
                test(err === "error");
            }
        });

        makeRequest(handler);
    }
}];
