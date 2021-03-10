import { Endpoint, Middleware } from "./types";
import { IncomingMessage, ServerResponse } from "http";

export class UrlPatternEndpoint<
    Context,
    Req extends IncomingMessage,
    Res extends ServerResponse,
    M extends Middleware<Context, Req> = Middleware<Context, Req>
>
    implements Endpoint<Context, Req, Res, M>
{
    private patternMatches: RegExpMatchArray | null;
    private pattern: RegExp;
    private urlHandler: (matches: RegExpMatchArray | null, req: Req, res: Res) => void;

    constructor(pattern: RegExp, handler: (matches: RegExpMatchArray | null, req: Req, res: Res) => void) {
        this.pattern = pattern;
        this.patternMatches = null;
        this.urlHandler = handler;
    }

    when(req: Req) {
        this.patternMatches = req.url!.match(this.pattern);
        return !!this.patternMatches;
    }

    do(req: Req, res: Res) {
        this.urlHandler(
            this.patternMatches,
            req,
            res
        );
    };
}
