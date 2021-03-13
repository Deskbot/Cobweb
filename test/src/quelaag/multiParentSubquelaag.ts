import { multiParentSubquelaag, quelaag, subquelaag } from "../../../src";
import { Test } from "../framework";
import { objectNotAny } from "../util";

function setup(cb1: () => void, cb2: () => void) {
    const makeMiddleware1 = quelaag({
        func(req: number): void {
            cb1();
        }
    });

    const makeMiddleware2 = quelaag({
        func(req: string): void {
            cb2();
        }
    });

    const makeMultiParentMiddleware = multiParentSubquelaag({
        one: makeMiddleware1,
        two: makeMiddleware2,
    }, {
        func1(req, con) { // req is the union of the request types in the parent middlewares, which I'm not sure is good
            objectNotAny(con);
            return con.one.func();
        },
        func2(req, con) {
            objectNotAny(con);
            return con.two.func();
        },
    });

    // compiles as proof that you can go multiple levels deep
    const makeMiddleware3 = subquelaag(makeMultiParentMiddleware, {
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
            one: makeMiddleware1(1, undefined),
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
