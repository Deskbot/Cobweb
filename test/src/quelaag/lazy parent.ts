import { quelaag } from "../../../src";
import { Test } from "../framework";

function setup(cb1: () => void) {
    const parent = quelaag({
        func(req: string): void {
            cb1();
        }
    });

    const lazyParentQ = quelaag({
        func(req: string, context: () => ReturnType<typeof parent>): void {
            context().func();
        }
    });

    return { parent, lazyParentQ };
}

function computeOnce<A extends unknown[], R, F extends (...args: A) => R>(f: F): F {
    let computed = false;
    let result: R;

    const memo = (...args: A) => {
        if (!computed) {
            result = f(...args);
            computed = true;
        }

        return result;
    };

    return memo as F;
}

export const lazyParentTests: Test[] = [
    {
        name: "SubQuelaag has a lazy parent",
        cases: 2,
        run: ({ test }) => {
            let count1 = 0;

            const { parent, lazyParentQ } = setup(() => count1 += 1);

            const req = "";
            const mid = lazyParentQ(req, computeOnce(() => parent(req, undefined)));

            mid.func();
            test(count1 === 1);
            mid.func();
            test(count1 === 1);
        }
    }
];
