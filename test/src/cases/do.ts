import { Quelaag } from "../../../src";
import { makeRequest, Test } from "../framework";

export const doTests: Test[] = [{
    name: "A server should be able to listen to things.",
    run({ pass }) {
        const handler = new Quelaag({});
        handler.addSpy({
            when: () => true,
            do: () => {
                pass();
            },
        });

        makeRequest(handler);
    }
},

{
    name: "A server should be able to use custom endpoints.",
    run({ pass }) {
        const handler = new Quelaag({});
        handler.addEndpoint({
            when: () => true,
            do: () => {
                pass();
            },
        });

        makeRequest(handler);
    }
},

{
    name: "A server should end at the only valid endpoint.",
    run({ pass, fail }) {
        const handler = new Quelaag({});
        handler.addEndpoint({
            when: () => false,
            do: () => {
                fail();
            },
        });
        handler.addEndpoint({
            when: () => true,
            do: () => {
                pass();
            },
        });
        handler.addEndpoint({
            when: () => false,
            do: () => {
                fail();
            },
        });

        makeRequest(handler);
    }
},

{
    name: "A server should use the first valid endpoint provided.",
    run({ pass, fail }) {
        const handler = new Quelaag({});
        handler.addEndpoint({
            when: () => true,
            do: () => {
                pass();
            },
        });
        handler.addEndpoint({
            when: () => true,
            do: () => {
                fail();
            },
        });

        makeRequest(handler);
    }
},

{
    name: "A server should not fall over when no listeners or endpoints are defined.",
    run({ pass, fail }) {
        const handler = new Quelaag({});

        makeRequest(handler).then(() => {
            pass();
        }, () => {
            fail();
        });
    }
},

{
    name: "A server should use the default endpoint if one is set.",
    run({ pass }) {
        const handler = new Quelaag({});
        handler.setFallbackEndpoint({
            do: () => pass()
        });

        makeRequest(handler);
    }
},

{
    name: "A server should not use the default endpoint if another one matches.",
    run({ pass, fail }) {
        const handler = new Quelaag({});
        handler.addEndpoint({
            when: () => true,
            do: () => {
                pass();
            }
        });
        handler.setFallbackEndpoint({
            do: () => fail()
        });

        makeRequest(handler);
    }
}];
