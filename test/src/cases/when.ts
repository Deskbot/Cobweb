import { Quelaag } from "../../../src";
import { makeRequest, Test } from "../framework";

export const whenTests: Test[] = [{
    name: "A spy is called when its when is true.",
    run({ pass }) {
        const handler = new Quelaag({});
        handler.addSpy({
            when: () => true,
            do: () => {
                pass();
            },
        });

        makeRequest(handler);
    }
},
{
    name: "An endpoint is called when its when is true.",
    run({ pass }) {
        const handler = new Quelaag({});
        handler.addEndpoint({
            when: () => true,
            do: () => {
                pass();
            },
        });

        makeRequest(handler);
    }
}, {
    name: "A spy is not called when its when is false.",
    run({ fail }) {
        const handler = new Quelaag({});
        handler.addSpy({
            when: () => false,
            do: () => {
                fail();
            },
        });

        makeRequest(handler);
    }
},
{
    name: "An endpoint is not called when its when is false.",
    run({ fail }) {
        const handler = new Quelaag({});
        handler.addEndpoint({
            when: () => false,
            do: () => {
                fail();
            },
        });

        makeRequest(handler);
    }
},
{
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
