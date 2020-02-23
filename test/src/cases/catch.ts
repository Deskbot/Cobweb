import { Quelaag } from "../../../src";
import { makeRequest, Test } from "../framework";

export const catchTests: Test[] = [{
    name: "A thrown exception in `when` should be caught.",
    run({ fail, test }) {
        const handler = new Quelaag({});
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
        const handler = new Quelaag({});
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
        const handler = new Quelaag({});
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
        const handler = new Quelaag({});
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
}];
