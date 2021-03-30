import { IncomingMessage } from "http";
import { quelaag, Router, subquelaag } from "../../../src";
import { makeRequest, Test } from "../framework";

let count = 0;

module Super {
    export const superR = new Router(quelaag({
        soup(req: IncomingMessage): void {
            count += 1;
        }
    }));

    superR.addSubRouter({
        when: () => {
            return true
        },
        router: () => {
            return Sub.subR
        },
    });
}

module Sub {
    export const subR = new Router(
        subquelaag(Super.superR.quelaag, {
            sandwich(req, con): void {
                con.soup();
            },
        })
    );

    subR.addEndpoint({
        when: () => true,
        do: (req, res, middleware) => {
            middleware.sandwich();
        }
    });
}

export const subrouterTests: Test[] = [
    {
        name: "SubRouter",
        cases: 1,
        run: async ({ test }) => {
            count = 0;
            await makeRequest(Super.superR);
            test(count === 1, `count was actually ${count}`);
        }
    },
];
