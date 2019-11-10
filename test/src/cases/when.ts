import { Quelaag } from "../../../src";
import { makeRequest, Test } from "../framework";

export const whenTests: Test[] = [{
    name: "Whens can be asynchronous.",
    run({ pass, test }) {
        let when = false;

        const handler = new Quelaag({});
        handler.addObserver({
            when: async () => {
                when = true;
                return true;
            },
            do: () => {
                test(when);
                pass();
            },
        });

        makeRequest(handler);
    }
}];