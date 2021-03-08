import { run, rejectAfter, Test } from "./framework";
import { TEST_FAILS_AFTER } from "./config";
import { middlewareTests } from "./router/middleware";
import { catchTests } from "./router/catch";
import { errorTests } from "./router/error";
import { doTests } from "./router/do";
import { whenTests } from "./router/when";
import { subquelaagTests } from "./quelaag/subquelaag";

main();

async function main() {
    const anyFailed = await runTests([
        ...catchTests,
        ...doTests,
        ...errorTests,
        ...middlewareTests,
        ...whenTests,
        ...subquelaagTests,
    ]);

    if (anyFailed) {
        process.exit(1);
    }
}

async function runTests(allTests: Test[]): Promise<boolean> {
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

    return fails > 0;
}
