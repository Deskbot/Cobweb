import { IncomingMessage, ServerResponse } from "http";

export interface RequestHandler<
    REQ extends IncomingMessage,
    RES extends ServerResponse,
    M extends Middleware<REQ>
> {
    (req: REQ, res: RES, middleware: M): void
}

export interface RequestSideEffect<REQ extends IncomingMessage, M extends Middleware<REQ>> {
    (req: REQ, middlewares: M): void;
}

export interface RequestPredicate<REQ extends IncomingMessage> {
    (req: REQ): boolean | Promise<boolean>;
}

export interface Endpoint<REQ extends IncomingMessage, RES extends ServerResponse, M extends Middleware<REQ>> {
    when: RequestPredicate<REQ>;
    do: RequestHandler<REQ, RES, M>;
}

export interface Spy<REQ extends IncomingMessage, M extends Middleware<REQ>> {
    when: RequestPredicate<REQ>;
    do: RequestSideEffect<REQ, M>;
}

export type MiddlewareSpec<
    REQ extends IncomingMessage,
    K extends string | number | symbol = string | number | symbol
>
    = Record<K, (req?: REQ) => any>;

export type Middleware<
    REQ extends IncomingMessage,
    M extends MiddlewareSpec<REQ> = MiddlewareSpec<REQ>,
> = {
    [N in keyof M]: () => ReturnType<M[N]>
};

export interface MiddlewareConstructor<REQ extends IncomingMessage, M extends Middleware<REQ>> {
    new(req: REQ): M;
    prototype?: Partial<M>;
}
