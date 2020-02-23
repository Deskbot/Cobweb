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
    run(ex) {
        const handler = new Quelaag({});
        handler.addEndpoint({
            when: () => false,
            do: () => {},
            catch: () => {
                ex.fail();
            },
        });
        handler.addEndpoint({
            when: () => Promise.reject("error2"),
            do: () => {},
            catch: (err) => {
                ex.test(err === "error2");
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
},
{
    name: "A thrown exception in fallback handler should be caught.",
    run({ pass }) {
        const handler = new Quelaag({});
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
        const handler = new Quelaag({});
        handler.setFallbackEndpoint({
            do: () => Promise.reject("error1"),
            catch: () => {
                pass();
            },
        });

        makeRequest(handler);
    }
},];
