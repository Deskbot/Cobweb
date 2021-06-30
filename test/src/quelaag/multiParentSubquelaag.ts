import { multiParentSubquelaag, quelaag, subquelaag } from "../../../src";
import { Test } from "../framework";
import { numberNotAny, objectNotAny, stringNotAny } from "../util";

function setup(cb1: () => void, cb2: () => void) {
    const makeMiddleware1 = quelaag({
        func(req: string): number {
            cb1();
            return 1
        }
    });

    const makeMiddleware2 = quelaag({
        func(req: string): string {
            cb2();
            return ""
        }
    });

    const makeMultiParentMiddleware = multiParentSubquelaag<{
        one: typeof makeMiddleware1,
        two: typeof makeMiddleware2,
    }>()({
        // req is the union of the request types in the parent middlewares, which I'm not sure is good
        func1(req, con): number {
            objectNotAny(con);
            const ret = con.one.func();
            numberNotAny(ret)
            return ret
        },
        func2(req, con): string {
            objectNotAny(con);
            const ret = con.two.func();
            stringNotAny(ret)
            return ret
        },
    });

    // compiles as proof that you can go multiple levels deep
    const makeMiddleware3 = subquelaag<typeof makeMultiParentMiddleware>()({
        func(req, con) {
            objectNotAny(con);
            return con.func2();
        },
    });

    return { makeMiddleware1, makeMiddleware2, makeMultiParentMiddleware };
}

export const multiParentSubquelaagTests: Test[] = [
{
    name: "Multiple Parent Quelaags",
    cases: 4,
    run: ({ test }) => {
        let count1 = 0;
        let count2 = 0;

        const { makeMiddleware1, makeMiddleware2, makeMultiParentMiddleware } = setup(() => count1 += 1, () => count2 += 1);

        const mid = makeMultiParentMiddleware("", {
            one: makeMiddleware1("", undefined),
            two: makeMiddleware2("", undefined),
        });

        // func1
        mid.func1();
        test(count1 === 1);
        mid.func1();
        test(count1 === 1);

        // func2
        mid.func2();
        test(count2 === 1);
        mid.func2();
        test(count2 === 1);
    }
}
];
