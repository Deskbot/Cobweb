"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../../../src");
const framework_1 = require("../framework");
exports.middlewareTests = [{
        name: "Middleware can be called from a request listener.",
        run: async ({ pass, test }) => {
            const handler = new src_1.Quelaag({
                helloWorld: (req) => "hello world",
            });
            handler.setFallbackEndpoint((req, res, middleware) => {
                test(middleware.helloWorld() === "hello world");
                pass();
            });
            await framework_1.makeRequest(handler);
        },
    },
    {
        name: "Middleware calls are memoised.",
        run: async ({ pass, test }) => {
            let externalData = "one";
            const handler = new src_1.Quelaag({
                getExternalData: (req) => {
                    externalData += " change";
                    return externalData;
                },
            });
            handler.setFallbackEndpoint((req, res, middleware) => {
                test(middleware.getExternalData() === "one change", middleware.getExternalData());
                test(middleware.getExternalData() === "one change", middleware.getExternalData());
                pass();
            });
            await framework_1.makeRequest(handler);
        },
    },
    {
        name: "Middleware calls are memoised across listeners.",
        cases: 4,
        run: async ({ pass, test }) => {
            let externalData = "one";
            const handler = new src_1.Quelaag({
                getExternalData: (req) => {
                    externalData += " change";
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
            await framework_1.makeRequest(handler);
        },
    },
    {
        name: "Middleware calls are not memoised across handles.",
        cases: 3,
        run: async ({ pass, test }) => {
            let expected = 0;
            let actual = 0;
            const handler = new src_1.Quelaag({
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
            await framework_1.makeRequest(handler);
            await framework_1.makeRequest(handler);
            await framework_1.makeRequest(handler);
            pass();
        },
    },
    {
        name: "Middleware can call each other.",
        run: ({ pass, test }) => {
            const handler = new src_1.Quelaag({
                number() {
                    return 100;
                },
                isEven(req) {
                    return this.number() % 2 === 0;
                },
                isNotEven(req) {
                    return !this.isEven();
                },
                isOdd: function (req) {
                    return !this.isEven() && this.isNotEven();
                    ;
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
            framework_1.makeRequest(handler);
        },
    },
    {
        name: "Middleware can be asynchronous.",
        run: ({ pass, test }) => {
            const handler = new src_1.Quelaag({
                async number(req) {
                    return 100;
                },
                async isEven(req) {
                    return await this.number() % 2 == 0;
                },
                isOdd: async function (req) {
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
            framework_1.makeRequest(handler);
        },
    }];
//# sourceMappingURL=middleware.js.map