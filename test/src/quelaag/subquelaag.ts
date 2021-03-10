import { quelaag } from "../../../src";
import { Test } from "../framework";

export const subquelaagTests: Test[] = [
{
    name: "Manual Sub-Quelaag",
    cases: 3,
    run: ({ test }) => {
        let count = 0;

        const makeMiddleware1 = quelaag<undefined, string>({
            inc(req) {
                count += 1;
            }
        });

        const makeMiddleware2 = quelaag<undefined, string>({
            subquelaag(req) {
                return makeMiddleware1("request", undefined);
            },

            inc(req) {
                return this.subquelaag(req).inc(req);
            },
        });

        const mid = makeMiddleware2("hello");

        test(count === 0);
        mid.inc();
        test(count === 1);
        mid.inc();
        test(count === 1);
    }
}
];
