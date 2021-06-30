import { quelaag } from "../../../src";
import { Test } from "../framework";

export const destructurableTests: Test[] = [
    {
        name: "Middleware objects are destructurable",
        cases: 4,
        run: ({ test }) => {
            let calls = 0

            const q = quelaag({
                rec(req: undefined) {
                    calls += 1
                    return calls
                }
            })

            {
                const middleware = q(undefined, undefined)
                const { rec } = middleware

                test(rec() === 1);
                test(middleware.rec() === 1);
            }

            {
                const middleware = q(undefined, undefined)
                const { rec } = middleware

                test(middleware.rec() === 1);
                test(rec() === 1);
            }
        }
    }
];
