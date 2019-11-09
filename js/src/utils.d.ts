/// <reference types="node" />
import { Endpoint, Middleware } from "./types";
import { IncomingMessage, ServerResponse } from "http";
export declare class UrlPatternEndpoint<M extends Middleware> implements Endpoint<M> {
    private patternMatches;
    private pattern;
    private urlHandler;
    constructor(pattern: RegExp, handler: (matches: RegExpMatchArray | null, req: IncomingMessage, res: ServerResponse) => void);
    when(req: IncomingMessage): boolean;
    do(req: IncomingMessage, res: ServerResponse): void;
}
