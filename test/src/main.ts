import { run, rejectAfter, Test } from "./framework";
import { TEST_FAILS_AFTER } from "./config";
import { middlewareTests } from "./cases/middleware";
import { serverBuilderTests } from "./cases/do";
import { whenTests } from "./cases/when";

main();

async function main() {
    await runTests([
        ...middlewareTests,
        ...serverBuilderTests,
        ...whenTests,
    ]);
}

async function runTests(allTests: Test[]) {
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
    console.log("================");
}
