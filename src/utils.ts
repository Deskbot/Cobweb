import { Endpoint, Middleware } from "./types";
import { IncomingMessage, ServerResponse } from "http";

export class UrlPatternEndpoint<
    Req extends IncomingMessage,
    Res extends ServerResponse,
    M extends Middleware<any, Req>
>
    implements Endpoint<M, Req, Res>
{
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
