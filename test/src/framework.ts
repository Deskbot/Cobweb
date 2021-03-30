import * as http from "http";
import * as util from "util";
import { RootRouter, Router } from "../../src";

import { TEST_PORT } from "./config";

export interface Test {
    readonly name: string;
    readonly run: (examiner: Examiner) => void;
    readonly cases?: number;
}

export interface Examiner {
    readonly fail: (reason?: unknown) => void;
    readonly pass: () => void;
    readonly test: (result: boolean, message?: string) => void;
}

export class Defer<T> {
    readonly promise: Promise<T>;
    private _resolve: (value: T | PromiseLike<T>) => void;
    private _reject: (reason?: unknown) => void;

    constructor() {
        this._resolve = () => { };
        this._reject = () => { };
        this.promise = new Promise<T>((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }

    resolve(value: T | PromiseLike<T>) {
        return this._resolve(value);
    }

    reject(reason?: unknown) {
        return this._reject(reason);
    }
}

export async function makeRequest(handler: RootRouter<http.IncomingMessage, http.ServerResponse, any>): Promise<void> {
    const defer = new Defer<void>();

    const server = http.createServer((req, res) => {
        handler.handle(req, res);
        res.end();
        defer.resolve(undefined);
    });

    await util.promisify(cb => server.listen(TEST_PORT, cb))();

    const reqToServer = http.request({
        path: undefined,
        port: TEST_PORT,
    });

    reqToServer.once("error", (err) => {
        defer.reject(err);
    });

    reqToServer.on("timeout", () => {
        // adding this handler prevents a timeout error from being thrown
        // we are not testing that the requests get closed, only that they are handled
    });

    reqToServer.end(() => {

    });

    return defer.promise.finally(() => {
        // ensure that only one server is alive at a time because they always use the same port
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
    private reject: (reason?: unknown) => void;

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

    fail(val: unknown) {
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

    test(result: boolean, message?: string) {
        if (result) {
            this.pass();
        } else {
            this.fail(message);
        }
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
