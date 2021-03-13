import { quelaagPartialTypes } from "../../../src";
import { Test } from "../framework";
import { noOp, numberNotAny, stringNotAny } from "../util";

export const quelaagPartialTypesTests: Test[] = [
    {
        name: "Quelaag with partially applied types",
        cases: 2,
        run: ({ test }) => {
            let count = 0;

            const q = quelaagPartialTypes<string, number>()({
                func(req, context) {
                    count += 1;

                    numberNotAny(req);
                    stringNotAny(context);
                    noOp();
                }
            });

            const mid = q(1, "");

            // call mid1, then mid2
            mid.func();
            test(count === 1);
            mid.func();
            test(count === 1);
        }
    }
];
