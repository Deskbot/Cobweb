import { ServerBuilder } from "../../src";
import { Defer, defer } from "./defer";

main();

interface Test {
    name: string;
    run(defer: Defer<void>): Promise<void>;
}

const tests: Test[] = [
    {
        name: "A server should be able to listen to things.",
        async run(defer) {
            const builder = new ServerBuilder();
            builder.addListener({
                condition: req => true,
                handler: () => ()
            })
        }
    },

    {
        name: "A server should end at the correct endpoint.",
        async run() {
            const builder = new ServerBuilder();
            fail();
        }
    },

    {
        name: "A server should not fall over when no listeners or endpoints are defined.",
        async run() {
            const builder = new ServerBuilder();
            pass("pass3");
        }
    },

    {
        name: "A server should use the default endpoint if one is set.",
        async run() {
            const builder = new ServerBuilder();
            fail("fail 4");
        }
    }
];

async function eventuallyReject(afterMilliseconds: number): Promise<void> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            reject();
        }, afterMilliseconds);
    });
}

async function main() {
    let passes = 0;
    let fails = 0;
    let incomplete = 0;

    const allTests = tests.map(async (test) => {
        console.log("------");
        console.log(test.name);

        incomplete += 1;

        try {
            await run(test);
            passes += 1;

        } catch (e) {
            console.log(e);
            fails += 1;
        }

        incomplete -= 1;
    })
        .map(test => Promise.race([test, eventuallyReject(allTests.length * 10000)]));

    console.log("------");
    console.log("Passes:     ", passes);
    console.log("Fails:      ", fails);
    console.log("Incomplete: ", incomplete);
}

function run(test: Test): Promise<void> {
    const doTest = defer<void>();
    test.run(doTest);
    return doTest.promise;
}
