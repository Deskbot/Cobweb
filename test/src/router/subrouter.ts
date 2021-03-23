import { IncomingMessage } from "http";
import { quelaag, Router, subquelaag } from "../../../src";
import { makeRequest, Test } from "../framework";

export const subrouterTests: Test[] = [
    {
        name: "Manual SubRouter proof of concept",
        run: async ({ pass }) => {
            // super

            const superR = new Router(quelaag({
                soup(req: IncomingMessage): void {

                }
            }));

            // sub

            type SubContext = typeof superR extends Router<any, any, any, infer Q, any> ?Q : never;

            const superQuelaag: SubContext = (superR as any).quelaag;

            const subR = new Router(
                subquelaag(superQuelaag as SubContext, {
                    sandwich(req, con): void {
                        con.soup();
                    },
                })
            );

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

                    // should compile
                    middleware.soup();
                }
            });

            await makeRequest(superR);
        }
    }
];
