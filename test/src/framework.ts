import * as http from "http";
import * as util from "util";

import { MiddlewareSpecification, MiddlewareInventory } from "../../src/types";
import { CobwebServer } from "../../src";
import { TEST_PORT } from "./config";

export interface Test {
    readonly name: string;
    readonly run: (examiner: Examiner) => void;
}

export interface Examiner {
    readonly fail: (reason?: any) => void;
    readonly pass: () => void;
    readonly test: (result: boolean, message?: string) => void;
}

export async function callEndpoint<M extends MiddlewareSpecification, B extends MiddlewareInventory<M>>
    (builder: CobwebServer<M, B>, path?: string): Promise<void> {
    const server = http.createServer((req, res) => {
        // call the created request listener
        // and put the return value in a promise
        // if the return value is a promise, it will wait for that to resolve instead
        Promise.resolve(builder.handle(req, res))
            .then(() => {
                res.end();
            });
    });

    await util.promisify(cb => server.listen(TEST_PORT, cb))();

    const reqToServer = http.request({
        path,
        port: TEST_PORT,
    });

    return new Promise<void>((resolve, reject) => {
        reqToServer.once("error", (err) => {
            reject(err);
        });

        reqToServer.on("timeout", () => {
            // adding this handler prevents a timeout error from being thrown
            // we are not testing that the requests get closed, only that they are handled
        });

        reqToServer.end(() => {
            resolve();
        });

    }).finally(() => {
        // ensure that only one server is alive at a time beacuse they always use the same port
        server.close();
    });
}

export async function rejectAfter(afterMilliseconds: number): Promise<void> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            reject(`Test timed out after ${afterMilliseconds / 1000} seconds.`);
        }, afterMilliseconds);
    });
}

export function run(test: Test): Promise<void> {
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
                    return;
                }

                return fail(message);
            },
            fail,
            pass,
        });
    });
}
