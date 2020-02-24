import { Quelaag } from "../../../src";
import { makeRequest, Test } from "../framework";
import { IncomingMessage } from "http";

export const middlewareTests: Test[] = [{
    name: "Middleware can be called from a request spy.",
    run: async ({ test }) => {
        const handler = new Quelaag({
            helloWorld: (req) => "hello world",
        });

        handler.setFallbackEndpoint({
            do: (req, res, middleware) => {
                test(middleware.helloWorld() === "hello world");
            }
        });

        await makeRequest(handler);
    },
},

{
    name: "Middleware calls are memoised when called from a handler.",
    cases: 2,
    run: async ({ test }) => {
        let externalData = "one";

        const handler = new Quelaag({
            getExternalData(req): string {
                externalData += " change";
                return externalData;
            },
            getMiddlewareData(req): string {
                return this.getExternalData(req);
            },
        });

        handler.addSpy({
            when: (req) => true,
            do: (req, middleware) => {
                middleware.getExternalData();
                middleware.getMiddlewareData();
                middleware.getExternalData();
                middleware.getMiddlewareData();
            },
        });

        handler.setFallbackEndpoint({
            do: (req, res, middleware) => {
                test(middleware.getExternalData() === "one change", middleware.getExternalData());
                test(middleware.getMiddlewareData() === "one change", middleware.getMiddlewareData());
                test(middleware.getExternalData() === "one change", middleware.getExternalData());
                test(middleware.getMiddlewareData() === "one change", middleware.getMiddlewareData());
            }
        });

        await makeRequest(handler);
    },
},

{
    name: "Middleware calls are memoised across spies.",
    cases: 4,
    run: async ({ test }) => {
        let externalData = "one";

        const handler = new Quelaag({
            getExternalData: (req) => {
                externalData += " change"
                return externalData;
            },
        });

        handler.addSpy({
            when: () => true,
            do: (req, middleware) => {
                test(middleware.getExternalData() === "one change");
                test(middleware.getExternalData() === "one change");
            }
        });

        handler.addSpy({
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
    run: async ({ test }) => {
        let expected = 0;
        let actual = 0;

        const handler = new Quelaag({
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
    },
},

{
    name: "Middleware can call each other.",
    cases: 2,
    run: ({ test }) => {
        const handler = new Quelaag({
            number(req): number {
                return 100;
            },
            isEven(req): boolean {
                return this.number(req) % 2 === 0;
            },
            isNotEven(req): boolean {
                return !this.isEven(req);
            },
            isOdd: function (req): boolean {
                return !this.isEven(req) && this.isNotEven(req);
            }
        });

        handler.addEndpoint({
            when: () => true,
            do: (req, res, middleware) => {
                test(middleware.isEven() === true);
                test(middleware.isOdd() === false);
            }
        });

        makeRequest(handler);
    },
},

{
    name: "Middleware can be asynchronous.",
    cases: 2,
    run: ({ test }) => {
        const handler = new Quelaag({
            async number(req: IncomingMessage) {
                return 100;
            },
            async isEven(req: IncomingMessage) {
                return await this.number() % 2 == 0;
            },
            isOdd: async function (req: IncomingMessage) {
                return !await this.isEven();
            }
        });

        handler.addEndpoint({
            when: () => true,
            do: async (req, res, middleware) => {
                test(await middleware.isEven() === true);
                test(await middleware.isOdd() === false);
            }
        });

        makeRequest(handler);
    },
}];
