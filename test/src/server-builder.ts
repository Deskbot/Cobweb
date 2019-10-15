import * as http from "http";
import * as util from "util";

import { ServerBuilder } from "../../src";
import { Defer, defer } from "./defer";

const TEST_PORT = 9999;

const TEN_SECONDS = 10000;

interface Test {
    name: string;
    run(defer: Defer<void>): Promise<void>;
}

const allTests: Test[] = [
    {
        name: "A server should be able to listen to things.",
        async run({ resolve }) {
            const builder = new ServerBuilder();
            builder.addListener({
                condition: () => true,
                handler: () => {
                    resolve();
                },
            });

            await callEndpoint(builder);
        }
    },

    {
        name: "A server should be able to use custom endpoints.",
        async run({ resolve }) {
            const builder = new ServerBuilder();
            builder.addEndpoint({
                condition: () => true,
                handler: () => {
                    resolve();
                },
            });

            await callEndpoint(builder);
        }
    },

    {
        name: "A server should end at the only valid endpoint.",
        async run({ resolve, reject }) {
            const builder = new ServerBuilder();
            builder.addEndpoint({
                condition: () => false,
                handler: () => {
                    reject();
                },
            });
            builder.addEndpoint({
                condition: () => true,
                handler: () => {
                    resolve();
                },
            });
            builder.addEndpoint({
                condition: () => false,
                handler: () => {
                    reject();
                },
            });

            await callEndpoint(builder);
        }
    },

    {
        name: "A server should use the first valid endpoint provided.",
        async run({ resolve, reject }) {
            const builder = new ServerBuilder();
            builder.addEndpoint({
                condition: () => true,
                handler: () => {
                    resolve();
                },
            });
            builder.addEndpoint({
                condition: () => true,
                handler: () => {
                    reject();
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
        async run({ resolve }) {
            const builder = new ServerBuilder();
            builder.setNoEndpointHandler(() => {
                resolve();
            });

            await callEndpoint(builder);
        }
    },

    {
        name: "A server should not use the default endpoint if another one matches.",
        async run({ reject }) {
            const builder = new ServerBuilder();
            builder.setNoEndpointHandler(() => {
                reject();
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
    });

    req.end();

    // server.close();
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
        console.log("------");
        console.log(test.name);

        try {
            await Promise.race([run(test), rejectAfter(TEN_SECONDS)]);
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
    const doTest = defer<void>();
    test.run(doTest);
    return doTest.promise;
}

main();
