import { Cobweb } from "../../../src";
import { makeRequest } from "../framework";

export const middlewareTests = [{
    name: "Middleware can be called from a request listener.",
    run: ({ pass, test }) => {
        const handler = new Cobweb({
            helloWorld: (req) => "hello world",
        });

        handler.setNoEndpointHandler((req, res, middleware) => {
            test(middleware.helloWorld() === "hello world");
            pass();
        });

        makeRequest(handler);
    },
},

{
    name: "Middleware calls are memoised.",
    run: ({ pass, test }) => {
        let externalData = "one";

        const handler = new Cobweb({
            getExternalData: (req) => {
                externalData += " change"
                return externalData;
            },
        });

        handler.setNoEndpointHandler((req, res, middleware) => {
            test(middleware.getExternalData() === "one change", middleware.getExternalData());
            test(middleware.getExternalData() === "one change", middleware.getExternalData());
            pass();
        });

        makeRequest(handler);
    },
},

{
    name: "Middleware calls are memoised across listeners.",
    run: ({ pass, test }) => {
        let externalData = "one";

        const handler = new Cobweb({
            getExternalData: (req) => {
                externalData += " change"
                return externalData;
            },
        });

        handler.addObserver({
            when: () => true,
            do: (req, middleware) => {
                test(middleware.getExternalData() === "one change");
                test(middleware.getExternalData() === "one change");
                pass();
            }
        });

        handler.addObserver({
            when: () => true,
            do: (req, middleware) => {
                test(middleware.getExternalData() === "one change");
                test(middleware.getExternalData() === "one change");
                pass();
            }
        });

        makeRequest(handler);
    },
},

{
    name: "Middleware calls are not memoised across handles.",
    run: async ({ pass, test }) => {
        let expected = 0;
        let actual = 0;

        const handler = new Cobweb({
            increment: () => {
                actual += 1;
                return actual;
            },
        });

        handler.addEndpoint({
            when: () => true,
            do: (req, res, middleware) => {

                // we expect that the actual is incremented by the middleware call
                expected += 1;
                test(middleware.increment() === expected, `Expected ${expected}, received ${actual}.`);
            }
        });

        await makeRequest(handler);
        await makeRequest(handler);
        await makeRequest(handler);

        pass();
    },
}];
