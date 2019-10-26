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
}];
