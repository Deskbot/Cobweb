import { IncomingMessage } from "http";
import { quelaag, Router, subquelaag } from "../../../src";
import { makeRequest, Test } from "../framework";

export const subrouterTests: Test[] = [
    {
        name: "Manual SubRouter endpoints",
        run: async ({ pass }) => {
            // super

            const superR = new Router(quelaag({}));

            // sub

            const subR = new Router(quelaag({}));

            // sub continues

            subR.addEndpoint({
                when: () => true,
                do: () => {
                    pass();
                }
            });

            // super continues

            superR.addEndpoint({
                when: () => true,
                do: (req, res, middleware) => {
                    subR.handle(req, res, (superR as any).quelaag);
                }
            });

            await makeRequest(superR);
        }
    },

    {
        name: "Manual SubRouter middleware",
        run: async ({ pass }) => {
            // super

            const superR = new Router(quelaag({
                soup(req: IncomingMessage): void {
                    pass();
                }
            }));

            // sub

            // type SubContext = typeof superR extends Router<any, any, any, infer Q, any> ? Q : never;

            const subR = new Router(
                subquelaag(superR.quelaag, {
                    sandwich(req, con): void {
                        con.soup();
                    },
                })
            );

            // sub continues

            subR.addEndpoint({
                when: () => true,
                do: () => {}
            });

            // super continues

            superR.addEndpoint({
                when: () => true,
                do: (req, res, middleware) => {
                    subR.handle(req, res, superR.quelaag);
                    middleware.soup();
                }
            });

            await makeRequest(superR);
        }
    }
];
