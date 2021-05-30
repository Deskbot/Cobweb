import { quelaag } from "../../../src";
import { Test } from "../framework";

export const recursiveTests: Test[] = [
    {
        name: "SubQuelaag has a lazy parent",
        cases: 2,
        run: ({ test }) => {
            let calls = 0

            const q = quelaag({
                rec(req: undefined) {
                    calls += 1

                    if (calls < 3) {
                        this.rec(req)
                    }
                }
            })

            const mid = q(undefined, undefined)

            mid.rec();
            test(calls === 3);
            mid.rec();
            test(calls === 3);
        }
    }
];
