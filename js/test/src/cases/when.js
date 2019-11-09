"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../../../src");
const framework_1 = require("../framework");
exports.whenTests = [{
        name: "Whens can be asynchronous.",
        run({ pass, test }) {
            let when = false;
            const handler = new src_1.Quelaag({});
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
            framework_1.makeRequest(handler);
        }
    }];
//# sourceMappingURL=when.js.map