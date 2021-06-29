import { IncomingMessage } from "http";
import { quelaag, router, subRouter } from "../../../src";
import { makeRequest, Test } from "../framework";
import { objectNotAny } from "../util";

let count = 0;

export const subrouterTests: Test[] = [];

// test 1

module Super1 {
    export const superR = router(quelaag({
        soup(req: IncomingMessage): void {
            count += 1;
        }
    }));

    superR.addSubRouter({
        when: () => true,
        router: () => Sub1.subR,
    });
}

module Sub1 {
    export const subR = subRouter<typeof Super1.superR>(
        {
            sandwich(req, con): void {
                objectNotAny(con)
                con.soup();
            },
        }
    );

    subR.addEndpoint({
        when: () => true,
        do: (req, res, middleware) => {
            objectNotAny(middleware)
            middleware.sandwich();
        }
    });
}

subrouterTests.push({
    name: "SubRouter",
    cases: 1,
    run: async ({ test }) => {
        count = 0;
        await makeRequest(Super1.superR);
        test(count === 1, `count was actually ${count}`);
    }
});

// test 2

module Super2 {
    export const superR = router(quelaag({
        soup(req: IncomingMessage): void {
            count += 1;
        }
    }));

    superR.addSubRouter({
        when: () => true,
        router: () => Sub2.subR,
    });
}

module Sub2 {
    export const subR = subRouter<typeof Super2.superR>(
        {
            sandwich(req, con): void {
                objectNotAny(con)
                con.soup();
            },
        }
    );

    subR.addEndpoint({
        when: () => true,
        do: (req, res, middleware) => {
            objectNotAny(middleware)
            middleware.sandwich();
        }
    });
}

subrouterTests.push({
    name: "SubRouter with middleware",
    cases: 1,
    run: async ({ test }) => {
        count = 0;
        await makeRequest(Super2.superR);
        test(count === 1, `count was actually ${count}`);
    }
});
