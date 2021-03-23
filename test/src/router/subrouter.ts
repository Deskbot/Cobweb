import { quelaag, Router } from "../../../src";
import { makeRequest, Test } from "../framework";

export const subrouterTests: Test[] = [
    {
        name: "Manual SubRouter proof of concept",
        run: async ({ pass }) => {
            const subR = new Router(quelaag({}));
            subR.addEndpoint({
                when: () => true,
                do: () => {
                    pass();
                }
            });

            const superR = new Router(quelaag({}));
            superR.addEndpoint({
                when: () => true,
                do: (req, res) => {
                    subR.handle(req, res, superR.quelaag);
                }
            });

            await makeRequest(superR);
        }
    }
];
