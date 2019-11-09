"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const util = require("util");
const config_1 = require("./config");
async function makeRequest(handler, path) {
    const server = http.createServer((req, res) => {
        handler.handle(req, res);
        res.end();
    });
    await util.promisify(cb => server.listen(config_1.TEST_PORT, cb))();
    const reqToServer = http.request({
        path,
        port: config_1.TEST_PORT,
    });
    return new Promise((resolve, reject) => {
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
exports.makeRequest = makeRequest;
async function rejectAfter(afterMilliseconds) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            reject(`Test timed out after ${afterMilliseconds / 1000} seconds.`);
        }, afterMilliseconds);
    });
}
exports.rejectAfter = rejectAfter;
function run(testcase) {
    return new Promise((resolve, reject) => {
        const passesRequired = testcase.cases ? testcase.cases : Infinity;
        let passes = 0;
        const maybeFinish = () => {
            if (passes >= passesRequired) {
                resolve();
            }
        };
        testcase.run({
            fail(val) {
                console.trace();
                reject(val);
            },
            pass: () => {
                resolve();
            },
            test(result, message) {
                if (result) {
                    passes += 1;
                    maybeFinish();
                    return;
                }
                return this.fail(message);
            },
        });
    });
}
exports.run = run;
//# sourceMappingURL=framework.js.map