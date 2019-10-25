import { ServerBuilder } from "../../../src";
import { callEndpoint } from "../framework";

export const serverBuilderTests = [{
    name: "A server should be able to listen to things.",
    run({ pass }) {
        const builder = new ServerBuilder({});
        builder.addObserver({
            when: () => true,
            do: () => {
                pass();
            },
        });

        callEndpoint(builder);
    }
},

{
    name: "A server should be able to use custom endpoints.",
    run({ pass }) {
        const builder = new ServerBuilder({});
        builder.addEndpoint({
            when: () => true,
            do: () => {
                pass();
            },
        });

        callEndpoint(builder);
    }
},

{
    name: "A server should end at the only valid endpoint.",
    run({ pass, fail }) {
        const builder = new ServerBuilder({});
        builder.addEndpoint({
            when: () => false,
            do: () => {
                fail();
            },
        });
        builder.addEndpoint({
            when: () => true,
            do: () => {
                pass();
            },
        });
        builder.addEndpoint({
            when: () => false,
            do: () => {
                fail();
            },
        });

        callEndpoint(builder);
    }
},

{
    name: "A server should use the first valid endpoint provided.",
    run({ pass, fail }) {
        const builder = new ServerBuilder({});
        builder.addEndpoint({
            when: () => true,
            do: () => {
                pass();
            },
        });
        builder.addEndpoint({
            when: () => true,
            do: () => {
                fail();
            },
        });

        callEndpoint(builder);
    }
},

{
    name: "A server should not fall over when no listeners or endpoints are defined.",
    run({ pass, fail }) {
        const builder = new ServerBuilder({});
        builder.build();

        callEndpoint(builder).then(() => {
            pass();
        }, () => {
            fail();
        });
    }
},

{
    name: "A server should use the default endpoint if one is set.",
    run({ pass }) {
        const builder = new ServerBuilder({});
        builder.setNoEndpointHandler(() => {
            pass();
        });

        callEndpoint(builder);
    }
},

{
    name: "A server should not use the default endpoint if another one matches.",
    run({ pass, fail }) {
        const builder = new ServerBuilder({});
        builder.addEndpoint({
            when: () => true,
            do: () => {
                pass();
            }
        });
        builder.setNoEndpointHandler(() => {
            fail();
        });

        callEndpoint(builder);
    }
}];
