import { quelaag } from "../../../src";
import { Test } from "../framework";

export const subquelaagTests: Test[] = [
{
    name: "Context as Quelaag",
    cases: 3,
    run: ({ test }) => {
        let count = 0;

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

        const mid1 = makeMiddleware1("", undefined);
        const mid2 = makeMiddleware2("hello", mid1);

        test(count === 0);
        mid1.inc();
        test(count === 1);
        mid1.inc();
        test(count === 1);
        mid2.inc();
        test(count === 1);
        mid2.inc();
        test(count === 1);
    }
}
];
