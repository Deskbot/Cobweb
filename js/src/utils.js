"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UrlPatternEndpoint {
    constructor(pattern, handler) {
        this.pattern = pattern;
        this.patternMatches = null;
        this.urlHandler = handler;
    }
    when(req) {
        this.patternMatches = req.url.match(this.pattern);
        return !!this.patternMatches;
    }
    do(req, res) {
        this.urlHandler(this.patternMatches, req, res);
    }
    ;
}
exports.UrlPatternEndpoint = UrlPatternEndpoint;
//# sourceMappingURL=utils.js.map