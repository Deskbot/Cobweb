import { Cobweb } from "../../../src";
import { makeRequest } from "../framework";

export const serverBuilderTests = [{
    name: "A server should be able to listen to things.",
    run({ pass }) {
        const handler = new Cobweb({});
        handler.addObserver({
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
        const handler = new Cobweb({});
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
        const handler = new Cobweb({});
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
        const handler = new Cobweb({});
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
        const handler = new Cobweb({});

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
        const handler = new Cobweb({});
        handler.setNoEndpointHandler(() => {
            pass();
        });

        makeRequest(handler);
    }
},

{
    name: "A server should not use the default endpoint if another one matches.",
    run({ pass, fail }) {
        const handler = new Cobweb({});
        handler.addEndpoint({
            when: () => true,
            do: () => {
                pass();
            }
        });
        handler.setNoEndpointHandler(() => {
            fail();
        });

        makeRequest(handler);
    }
}];
