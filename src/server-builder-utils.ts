import { ServerBuilder } from "./ServerBuilder";
import { ResponseHandler, RequestPredicate } from "./types";

export function addEndpointForUrlPattern(
    builder: ServerBuilder,
    pattern: RegExp,
    handler: (matches: RegExpMatchArray | null, req: Request, res: Response) => void
) {
    let patternMatches: RegExpMatchArray | null = null;

    builder.addEndpoint({
        condition: req => {
            patternMatches = req.url.match(pattern);
            return !!patternMatches;
        },
        handler: (req, res) => {
            return handler(
                patternMatches,
                req,
                res
            );
        },
    });
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
