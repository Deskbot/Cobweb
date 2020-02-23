import * as http from "http";
import * as util from "util";

import { Quelaag } from "../../src";
import { TEST_PORT } from "./config";

export interface Test {
    readonly name: string;
    readonly run: (examiner: Examiner) => void;
    readonly cases?: number;
}

export interface Examiner {
    readonly fail: (reason?: any) => void;
    readonly pass: () => void;
    readonly test: (result: boolean, message?: string) => void;
}

export async function makeRequest(handler: Quelaag, path?: string): Promise<void> {
    const server = http.createServer((req, res) => {
        handler.handle(req, res);
        res.end();
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

class ExaminerImpl implements Examiner {
    private passes: number;
    private passesRequired: number;
    public readonly promise: Promise<void>;
    private resolve: (value?: void | PromiseLike<void> | undefined) => void;
    private reject: (reason?: any) => void;

    constructor(passesRequired: number | undefined) {
        this.passes = 0;
        this.passesRequired = passesRequired ?? 0;

        this.resolve = () => {};
        this.reject = () => {};
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    fail(val) {
        console.trace();
        this.reject(val);
    }

    private maybeFinish() {
        if (this.passes >= this.passesRequired) {
            this.resolve();
        }
    }

    pass() {
        this.passes += 1;
        this.maybeFinish();
    }

    test(result, message) {
        if (result) {
            this.pass();
            return;
        }

        return this.fail(message);
    }
}

export function run(testcase: Test): Promise<void> {
    const examiner = new ExaminerImpl(testcase.cases);

    // yes, this is necessary due to destructuring the examiner in the tests
    testcase.run({
        pass: () => examiner.pass(),
        fail: (e) => examiner.fail(e),
        test: (b,m) => examiner.test(b,m),
    });
    return examiner.promise;
}
