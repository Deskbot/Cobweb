"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const framework_1 = require("./framework");
const config_1 = require("./config");
const middleware_1 = require("./cases/middleware");
const do_1 = require("./cases/do");
const when_1 = require("./cases/when");
main();
async function main() {
    await runTests([
        ...middleware_1.middlewareTests,
        ...do_1.doTests,
        ...when_1.whenTests,
    ]);
}
async function runTests(allTests) {
    let passes = 0;
    let fails = 0;
    for (const test of allTests) {
        console.log(">", test.name);
        try {
            await Promise.race([framework_1.run(test), framework_1.rejectAfter(config_1.TEST_FAILS_AFTER)]);
            passes += 1;
        }
        catch (e) {
            console.log(e);
            fails += 1;
        }
    }
    console.log("----------------");
    console.log("Passes: ", passes);
    console.log("Fails:  ", fails);
    console.log("================");
}
//# sourceMappingURL=main.js.map