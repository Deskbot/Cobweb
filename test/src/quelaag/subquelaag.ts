import { quelaag, subquelaag, subquelaag2 } from "../../../src";
import { Test } from "../framework";
import { objectNotAny } from "../util";

function setup(callback: () => void) {
    const makeMiddleware1 = quelaag({
        func(req: string): void {
            callback();
        }
    });

    const makeMiddleware2 = subquelaag(makeMiddleware1, {
        func(req: string, con) {
            objectNotAny(con);
            return con.func();
        },
        func2(req: string, con) {
            objectNotAny(con);
            return 1;
        },
    });

    // compiles as proof that you can go multiple levels deep
    const makeMiddleware3 = subquelaag(makeMiddleware2, {
        func(req: string, con) {
            objectNotAny(con);
            return con.func2();
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
{
    name: "SubQuelaag2",
    cases: 2,
    run: ({ test }) => {
        let count = 0;

        const makeMiddleware1 = quelaag({
            func(req: string): void {
                count += 1;
            }
        });

        const makeMiddleware2 = subquelaag2<typeof makeMiddleware1>()({
            func(req: string, con) {
                objectNotAny(con);
                return con.func();
            },
            func2(req: string, con) {
                objectNotAny(con);
                return 1;
            },
        });

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
}
];
