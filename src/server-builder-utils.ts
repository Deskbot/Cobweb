import { ServerBuilder } from "./ServerBuilder";
import { ResponseHandler, RequestPredicate, Endpoint } from "./types";

export class UrlPatternEndpoint implements Endpoint {
    private patternMatches: RegExpMatchArray | null;
    private pattern: RegExp;
    private urlHandler: (matches: RegExpMatchArray | null, req: Request, res: Response) => void;

    constructor(pattern: RegExp, handler: (matches: RegExpMatchArray | null, req: Request, res: Response) => void) {
        this.pattern = pattern;
        this.patternMatches = null;
        this.urlHandler = handler;
    }

    condition(req: Request) {
        this.patternMatches = req.url.match(this.pattern);
        return !!this.patternMatches;
    }

    handler(req: Request, res: Response) {
        return this.urlHandler(
            this.patternMatches,
            req,
            res
        );
    };
}

export function addEndpoint(
    builder: ServerBuilder,
    condition: RequestPredicate,
    handler: ResponseHandler
) {
    builder.addEndpoint({ condition, handler });
}

export function addEndpointForUrl(
    builder: ServerBuilder,
    url: string,
    handler: ResponseHandler
) {
    builder.addEndpoint({
        condition: req => req.url === url,
        handler,
    });
}

export function isMethod(req: Request, method: string): boolean {
    return req.method === method;
}

export function isHead(req: Request): boolean {
    return isMethod(req, "HEAD");
}

export function isPut(req: Request): boolean {
    return isMethod(req, "PUT");
}

export function isDelete(req: Request): boolean {
    return isMethod(req, "DELETE");
}

export function isConnect(req: Request): boolean {
    return isMethod(req, "CONNECT");
}

export function isOptions(req: Request): boolean {
    return isMethod(req, "OPTIONS");
}

export function isTrace(req: Request): boolean {
    return isMethod(req, "TRACE");
}

export function isPatch(req: Request): boolean {
    return isMethod(req, "PATCH");
}

export function isGet(req: Request): boolean {
    return isMethod(req, "GET");
}

export function isPost(req: Request): boolean {
    return isMethod(req, "POST");
}

export function isUrl(req: Request, url: string): boolean {
    return req.url === url;
}
