import * as http from "http";
import * as util from "util";

import { ServerBuilder } from "../../src";

const TEST_PORT = 9999;
const TEST_FAILS_AFTER = 3000;

interface Test {
    readonly name: string;
    readonly run: (examiner: Examiner) => Promise<void>;
}

interface Examiner {
    readonly pass: () => void;
    readonly fail: (reason?: any) => void;
}

const allTests: Test[] = [
    {
        name: "A server should be able to listen to things.",
        async run({ pass }) {
            const builder = new ServerBuilder();
            builder.addListener({
                condition: () => true,
                handler: () => {
                    pass();
                },
            });

            await callEndpoint(builder);
        }
    },

    {
        name: "A server should be able to use custom endpoints.",
        async run({ pass }) {
            const builder = new ServerBuilder();
            builder.addEndpoint({
                condition: () => true,
                handler: () => {
                    pass();
                },
            });

            await callEndpoint(builder);
        }
    },

    {
        name: "A server should end at the only valid endpoint.",
        async run({ pass, fail }) {
            const builder = new ServerBuilder();
            builder.addEndpoint({
                condition: () => false,
                handler: () => {
                    fail();
                },
            });
            builder.addEndpoint({
                condition: () => true,
                handler: () => {
                    pass();
                },
            });
            builder.addEndpoint({
                condition: () => false,
                handler: () => {
                    fail();
                },
            });

            await callEndpoint(builder);
        }
    },

    {
        name: "A server should use the first valid endpoint provided.",
        async run({ pass, fail }) {
            const builder = new ServerBuilder();
            builder.addEndpoint({
                condition: () => true,
                handler: () => {
                    pass();
                },
            });
            builder.addEndpoint({
                condition: () => true,
                handler: () => {
                    fail();
                },
            });

            await callEndpoint(builder);
        }
    },

    {
        name: "A server should not fall over when no listeners or endpoints are defined.",
        async run() {
            const builder = new ServerBuilder();
            builder.build();

            await callEndpoint(builder);
        }
    },

    {
        name: "A server should use the default endpoint if one is set.",
        async run({ pass }) {
            const builder = new ServerBuilder();
            builder.setNoEndpointHandler(() => {
                pass();
            });

            await callEndpoint(builder);
        }
    },

    {
        name: "A server should not use the default endpoint if another one matches.",
        async run({ fail }) {
            const builder = new ServerBuilder();
            builder.setNoEndpointHandler(() => {
                fail();
            });

            await callEndpoint(builder);
        }
    }
];

async function callEndpoint(builder: ServerBuilder, path?: string): Promise<void> {
    const server = http.createServer(builder.build());

    await util.promisify(cb => server.listen(TEST_PORT, cb))();

    const req = http.request({
        path,
        port: TEST_PORT,
        timeout: 10000,
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
        console.log("------", test.name, "------");

        try {
            await Promise.race([run(test), rejectAfter(TEST_FAILS_AFTER)]);
            passes += 1;

        } catch (e) {
            console.log(e);
            fails += 1;
        }
    }

    console.log("------");
    console.log("Passes: ", passes);
    console.log("Fails:  ", fails);
}

function run(test: Test): Promise<void> {
    return new Promise((resolve, reject) => {
        test.run({
            fail: (val) => {
                console.trace();
                reject(val);
            },
            pass: () => resolve(),
        });
    });
}

main();
