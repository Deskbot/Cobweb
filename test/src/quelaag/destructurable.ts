import { quelaag } from "../../../src";
import { Test } from "../framework";

export const destructurableTests: Test[] = [
    {
        name: "Middleware objects are destructurable",
        cases: 4,
        run: ({ test }) => {
            let val = 0

            const q = quelaag({
                func(req: number) {
                    val += this.otherMethod(req)
                    return val
                },
                otherMethod(req: number) {
                    return req
                },
            })

            {
                const middleware = q(2, undefined)
                const { func } = middleware

                test(func() === 2);
                test(middleware.func() === 2);

                val = 0
            }

            {
                const middleware = q(3, undefined)
                const { func } = middleware

                test(middleware.func() === 3);
                test(func() === 3);

                val = 0
            }
        }
    }
];
