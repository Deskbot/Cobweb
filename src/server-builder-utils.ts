import { ServerBuilder } from "./ServerBuilder";
import { RequestPredicate, Endpoint } from "./types";
import { RequestListener, IncomingMessage, ServerResponse } from "http";

export class UrlPatternEndpoint implements Endpoint {
    private patternMatches: RegExpMatchArray | null;
    private pattern: RegExp;
    private urlHandler: (matches: RegExpMatchArray | null, req: IncomingMessage, res: ServerResponse) => void;

    constructor(pattern: RegExp, handler: (matches: RegExpMatchArray | null, req: IncomingMessage, res: ServerResponse) => void) {
        this.pattern = pattern;
        this.patternMatches = null;
        this.urlHandler = handler;
    }

    when(req: IncomingMessage) {
        this.patternMatches = req.url!.match(this.pattern);
        return !!this.patternMatches;
    }

    do(req: IncomingMessage, res: ServerResponse) {
        this.urlHandler(
            this.patternMatches,
            req,
            res
        );
    };
}

export function addEndpoint(
    builder: ServerBuilder,
    condition: RequestPredicate,
    handler: RequestListener
) {
    builder.addEndpoint({ when: condition, do: handler });
}

export function addEndpointForUrl(
    builder: ServerBuilder,
    url: string,
    handler: RequestListener
) {
    builder.addEndpoint({
        when: req => req.url === url,
        do: handler,
    });
}

export function isMethod(req: IncomingMessage, method: string): boolean {
    return req.method === method;
}

export function isHead(req: IncomingMessage): boolean {
    return isMethod(req, "HEAD");
}

export function isPut(req: IncomingMessage): boolean {
    return isMethod(req, "PUT");
}

export function isDelete(req: IncomingMessage): boolean {
    return isMethod(req, "DELETE");
}

export function isConnect(req: IncomingMessage): boolean {
    return isMethod(req, "CONNECT");
}

export function isOptions(req: IncomingMessage): boolean {
    return isMethod(req, "OPTIONS");
}

export function isTrace(req: IncomingMessage): boolean {
    return isMethod(req, "TRACE");
}

export function isPatch(req: IncomingMessage): boolean {
    return isMethod(req, "PATCH");
}

export function isGet(req: IncomingMessage): boolean {
    return isMethod(req, "GET");
}

export function isPost(req: IncomingMessage): boolean {
    return isMethod(req, "POST");
}

export function isUrl(req: IncomingMessage, url: string): boolean {
    return req.url === url;
}
