import * as http from "http";
import * as util from "util";

import { ServerBuilder } from "../../src";
import { MiddlewareInventory, MiddlewareSpecification } from "../../src/types";

const TEST_PORT = 9999;
const TEST_FAILS_AFTER = 3000;

interface Test {
    readonly name: string;
    readonly run: (examiner: Examiner) => void;
}

interface Examiner {
    readonly fail: (reason?: any) => void;
    readonly pass: () => void;
    readonly test: (result: boolean, message?: string) => void;
}

const allTests: Test[] = [{
    name: "Middleware can be called from a request listener.",
    run: ({ test }) => {
        const builder = new ServerBuilder({
            helloWorld: (req) => "hello world",
            welloHurld: () => "wello hurld",
        });

        builder.setNoEndpointHandler((req, res, middleware) => {
            test(middleware.helloWorld() === "hello world"); // compile
            test(middleware.welloHurld() === "hello world"); // compile
            // test(middleware.poop() === "hello world") // no compile
        });

        callEndpoint(builder);
    },
}];

async function callEndpoint(builder: ServerBuilder<MiddlewareSpecification<string>, MiddlewareInventory>, path?: string): Promise<void> {
    const server = http.createServer(builder.build());

    await util.promisify(cb => server.listen(TEST_PORT, cb))();

    const req = http.request({
        path,
        port: TEST_PORT,
    });

    return new Promise<void>((resolve, reject) => {
        req.once("error", (err) => {
            reject(err);
        });

        req.on("timeout", () => {
            // adding this handler prevents a timeout error from being thrown
            // we are not testing that the requests get closed, only that they are handled
        });

        req.end(() => {
            resolve();
        });

    }).finally(() => {
        // ensure that only one server is alive at a time beacuse they always use the same port
        server.close();
    });
}

async function rejectAfter(afterMilliseconds: number): Promise<void> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            reject(`Test timed out after ${afterMilliseconds / 1000} seconds.`);
        }, afterMilliseconds);
    });
}

async function main() {
    let passes = 0;
    let fails = 0;

    for (const test of allTests) {
        console.log(">", test.name);

        try {
            await Promise.race([run(test), rejectAfter(TEST_FAILS_AFTER)]);
            passes += 1;

        } catch (e) {
            console.log(e);
            fails += 1;
        }
    }

    console.log("----------------");
    console.log("Passes: ", passes);
    console.log("Fails:  ", fails);
}

function run(test: Test): Promise<void> {
    return new Promise((resolve, reject) => {
        const fail = (val) => {
            console.trace();
            reject(val);
        };

        const pass = () => {
            resolve();
        };

        test.run({
            test(result, message) {
                if (result) {
                    return pass();
                }

                return fail(message);
            },
            fail,
            pass,
        });
    });
}

main();

// the tests seem not to end? Is this just because of the async changse I just made?