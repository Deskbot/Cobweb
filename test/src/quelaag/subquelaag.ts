import { quelaag } from "../../../src";
import { Test } from "../framework";

function setup(callback: () => void) {
    const makeMiddleware1 = quelaag<undefined, string>({
        func(req) {
            callback();
        }
    });

    const makeMiddleware2 = quelaag<ReturnType<typeof makeMiddleware1>, string>({
        func(req, con) {
            return con.func();
        },
    });

    return { makeMiddleware1, makeMiddleware2 };
}

export const subquelaagTests: Test[] = [
{
    name: "Super Quelaag called first",
    cases: 4,
    run: ({ test }) => {
        let count = 0;

        let { makeMiddleware1, makeMiddleware2 } = setup(() => count += 1);

        const mid1 = makeMiddleware1("", undefined);
        const mid2 = makeMiddleware2("", mid1);

        // call mid1, then mid2
        mid1.func();
        test(count === 1);
        mid1.func();
        test(count === 1);

        mid2.func();
        test(count === 1);
        mid2.func();
        test(count === 1);
    }
},
{
    name: "Sub Quelaag called first",
    cases: 4,
    run: ({ test }) => {
        let count = 0;

        let { makeMiddleware1, makeMiddleware2 } = setup(() => count += 1);

        const mid1 = makeMiddleware1("", undefined);
        const mid2 = makeMiddleware2("", mid1);

        // call mid2, then mid1
        mid2.func();
        test(count === 1);
        mid2.func();
        test(count === 1);

        mid1.func();
        test(count === 1);
        mid1.func();
        test(count === 1);
    }
},
{
    name: "Super and Sub Quelaag calls jumbled up",
    cases: 4,
    run: ({ test }) => {
        let count = 0;

        let { makeMiddleware1, makeMiddleware2 } = setup(() => count += 1);

        const mid1 = makeMiddleware1("", undefined);
        const mid2 = makeMiddleware2("", mid1);

        // mix order
        mid1.func();
        test(count === 1);

        mid2.func();
        test(count === 1);

        mid1.func();
        test(count === 1);

        mid2.func();
        test(count === 1);
    }
},
];
