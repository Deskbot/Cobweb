import { Quelaag } from "../../../src";
import { makeRequest, Test } from "../framework";

export const whenTests: Test[] = [{
    name: "Whens can be asynchronous.",
    run({ test }) {
        let when = false;

        const handler = new Quelaag({});
        handler.addSpy({
            when: async () => {
                when = true;
                return true;
            },
            do: () => {
                test(when);
            },
        });

        makeRequest(handler);
    }
}];
