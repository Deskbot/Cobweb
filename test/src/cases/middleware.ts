import { Cobweb } from "../../../src";
import { makeRequest, Test } from "../framework";

export const middlewareTests: Test[] = [{
    name: "Middleware can be called from a request listener.",
    run: async ({ pass, test }) => {
        const handler = new Cobweb({
            helloWorld: (req) => "hello world",
        });

        handler.setNoEndpointHandler((req, res, middleware) => {
            test(middleware.helloWorld() === "hello world");
            pass();
        });

        await makeRequest(handler);
    },
},

{
    name: "Middleware calls are memoised.",
    run: async ({ pass, test }) => {
        let externalData = "one";

        const handler = new Cobweb({
            getExternalData: (req) => {
                externalData += " change";
                return externalData;
            },
        });

        handler.setNoEndpointHandler((req, res, middleware) => {
            test(middleware.getExternalData() === "one change", middleware.getExternalData());
            test(middleware.getExternalData() === "one change", middleware.getExternalData());
            pass();
        });

        await makeRequest(handler);
    },
},

{
    name: "Middleware calls are memoised across listeners.",
    cases: 4,
    run: async ({ pass, test }) => {
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
            }
        });

        handler.addObserver({
            when: () => true,
            do: (req, middleware) => {
                test(middleware.getExternalData() === "one change");
                test(middleware.getExternalData() === "one change");
            }
        });

        await makeRequest(handler);
    },
},

{
    name: "Middleware calls are not memoised across handles.",
    cases: 3,
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
},

{
    name: "Middleware can call each other.",
    run: ({ pass, test }) => {
        const handler = new Cobweb({
            number(req) {
                return 100;
            },
            isEven(req) {
                return this.number() % 2 === 0;
            },
            isOdd: function(req) {
                return !this.isEven();
            }
        });

        handler.addEndpoint({
            when: () => true,
            do: (req, res, middleware) => {
                test(middleware.isEven() === true);
                test(middleware.isOdd() === false);
                pass();
            }
        });

        makeRequest(handler);
    },
},

{
    name: "Middleware can be asynchronous.",
    run: ({ pass, test }) => {
        const handler = new Cobweb({
            async number(req) {
                return 100;
            },
            async isEven(req) {
                return await this.number() % 2 == 0
            },
            isOdd: async function(req) {
                return !await this.isEven();
            }
        });

        handler.addEndpoint({
            when: () => true,
            do: async (req, res, middleware) => {
                test(await middleware.isEven() === true);
                test(await middleware.isOdd() === false);
                pass();
            }
        });

        makeRequest(handler);
    },
}];
