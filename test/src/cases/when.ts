import { quelaag, Router } from "../../../src";
import { makeRequest, Test } from "../framework";

export const whenTests: Test[] = [{
    name: "A spy is called when its when is true.",
    run({ pass }) {
        const handler = new Router(quelaag({}));
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
        const handler = new Router(quelaag({}));
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
    run({ fail, pass }) {
        const handler = new Router(quelaag({}));
        handler.addSpy({
            when: () => false,
            do: () => {
                fail();
            },
        });
        handler.addEndpoint({
            when: () => true,
            do: () => {
                pass();
            },
        });

        makeRequest(handler);
    }
},
{
    name: "An endpoint is not called when its when is false.",
    run({ fail, pass }) {
        const handler = new Router(quelaag({}));
        handler.addEndpoint({
            when: () => false,
            do: () => {
                fail();
            },
        });
        handler.addEndpoint({
            when: () => true,
            do: () => {
                pass();
            },
        });

        makeRequest(handler);
    }
},
{
    name: "Whens can be asynchronous.",
    run({ test }) {
        let when = false;

        const handler = new Router(quelaag({}));
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
