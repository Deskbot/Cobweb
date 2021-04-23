import { quelaag } from "../../../src";
import { Test } from "../framework";
import { noOp, numberNotAny, stringNotAny } from "../util";

export const quelaagPartialTypesTests: Test[] = [
    {
        name: "Quelaag with partially applied types",
        cases: 2,
        run: ({ test }) => {
            let count = 0;

            const spec = {
                func(req: number, context: string) {
                    count += 1;

                    numberNotAny(req);
                    stringNotAny(context);
                    noOp();
                }
            };

            const q = quelaag<number, string, typeof spec>(spec);

            const mid = q(1, "");

            // call mid1, then mid2
            mid.func();
            test(count === 1);
            mid.func();
            test(count === 1);
        }
    }
];
