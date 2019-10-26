import { CobwebServer } from "../../../src";
import { callEndpoint } from "../framework";

export const middlewareTests = [{
    name: "Middleware can be called from a request listener.",
    run: ({ pass, test }) => {
        const builder = new CobwebServer({
            helloWorld: (req) => "hello world",
        });

        builder.setNoEndpointHandler((req, res, middleware) => {
            test(middleware.helloWorld() === "hello world");
            pass();
        });

        callEndpoint(builder);
    },
},

{
    name: "Middleware calls are memoised.",
    run: ({ pass, test }) => {
        let externalData = "one";

        const builder = new CobwebServer({
            getExternalData: (req) => {
                externalData += " change"
                return externalData;
            },
        });

        builder.setNoEndpointHandler((req, res, middleware) => {
            test(middleware.getExternalData() === "one change", middleware.getExternalData());
            test(middleware.getExternalData() === "one change", middleware.getExternalData());
            pass();
        });

        callEndpoint(builder);
    },
},

{
    name: "Middleware calls are memoised across listeners.",
    run: ({ pass, test }) => {
        let externalData = "one";

        const builder = new CobwebServer({
            getExternalData: (req) => {
                externalData += " change"
                return externalData;
            },
        });

        builder.addObserver({
            when: () => true,
            do: (req, middleware) => {
                test(middleware.getExternalData() === "one change");
                test(middleware.getExternalData() === "one change");
                pass();
            }
        });

        builder.addObserver({
            when: () => true,
            do: (req, middleware) => {
                test(middleware.getExternalData() === "one change");
                test(middleware.getExternalData() === "one change");
                pass();
            }
        });

        callEndpoint(builder);
    },
},

{
    name: "Middleware calls are not memoised across handles.",
    run: async ({ pass, test }) => {
        let expected = 0;
        let actual = 0;

        const builder = new CobwebServer({
            increment: () => {
                actual += 1;
                return actual;
            },
        });

        builder.addEndpoint({
            when: () => true,
            do: (req, res, middleware) => {

                // we expect that the actual is incremented by the middleware call
                expected += 1;
                test(middleware.increment() === expected, `Expected ${expected}, received ${actual}.`);
            }
        });

        await callEndpoint(builder);
        await callEndpoint(builder);
        await callEndpoint(builder);

        pass();
    },
}];
