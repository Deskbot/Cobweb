import { ServerBuilder } from "../../src";
import { promisify } from "util";

interface TestWatcher {
    pass(message?: string): void;
    fail(message?: string): void;
}

interface Test {
    name: string;
    run(watcher: TestWatcher): void;
}

const tests: Test[] = [
    {
        name: "A server should be able to listen to things.",
        run({pass}) {
            const builder = new ServerBuilder();
            builder.addListener({
                condition: req => true,
                handler: () => pass()
            })
        }
    },

    {
        name: "A server should end at the correct endpoint.",
        run({pass, fail}) {
            const builder = new ServerBuilder();
            fail();
        }
    },

    {
        name: "A server should not fall over when no listeners or endpoints are defined.",
        run({pass, fail}) {
            const builder = new ServerBuilder();
            pass("pass3");
        }
    },

    {
        name: "A server should use the default endpoint if one is set.",
        run({fail}) {
            const builder = new ServerBuilder();
            fail("fail 4");
        }
    }
];

let passes = 0;
let fails = 0;

tests.forEach(async (test) => {
    console.log("------");
    console.log(test.name);

    const fail = (errorMessage?: any) => {
        if (errorMessage) {
            console.log(errorMessage);
        }
        fails += 1;
    };

    const watcher = {
        pass: (passMessage: any) => {
            if (passMessage) {
                console.log(passMessage);
            }

            passes += 1;
        },
        fail,
    };

    try {
        test.run(watcher);

    } catch (e) {
        fail(e);
    }
});

console.log("------");
console.log("Passes: ", passes);
console.log("Fails:  ", fails);
