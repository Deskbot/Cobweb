import { quelaag } from "../../../src";
import { Test } from "../framework";

export const subquelaagTests: Test[] = [
{
    name: "Context as Quelaag",
    cases: 12,
    run: ({ test }) => {
        let count: number;

        const makeMiddleware1 = quelaag<undefined, string>({
            inc(req) {
                count += 1;
            }
        });

        const makeMiddleware2 = quelaag<ReturnType<typeof makeMiddleware1>, string>({
            inc(req, con) {
                return con.inc();
            },
        });

        {
            count = 0;

            const mid1 = makeMiddleware1("", undefined);
            const mid2 = makeMiddleware2("", mid1);

            // call mid1, then mid2
            mid1.inc();
            test(count === 1);
            mid1.inc();
            test(count === 1);

            mid2.inc();
            test(count === 1);
            mid2.inc();
            test(count === 1);
        }

        {
            count = 0;

            const mid1 = makeMiddleware1("", undefined);
            const mid2 = makeMiddleware2("", mid1);

            // call mid2, then mid1
            mid2.inc();
            test(count === 1);
            mid2.inc();
            test(count === 1);

            mid1.inc();
            test(count === 1);
            mid1.inc();
            test(count === 1);
        }

        {
            count = 0;

            const mid1 = makeMiddleware1("", undefined);
            const mid2 = makeMiddleware2("", mid1);

            // mix order
            mid1.inc();
            test(count === 1);

            mid2.inc();
            test(count === 1);

            mid1.inc();
            test(count === 1);

            mid2.inc();
            test(count === 1);
        }
    }
}
];
