import { IncomingMessage, ServerResponse } from "http";

export interface RequestHandler<
    REQ extends IncomingMessage,
    RES extends ServerResponse,
    M extends Middleware
> {
    (req: REQ, res: RES, middleware: M): void
}

export interface RequestSideEffect<REQ extends IncomingMessage, M extends Middleware> {
    (req: REQ, middlewares: M): void;
}

export interface RequestPredicate<REQ extends IncomingMessage> {
    (req: REQ): boolean | Promise<boolean>;
}

export interface Endpoint<REQ extends IncomingMessage, RES extends ServerResponse, M extends Middleware> {
    when: RequestPredicate<REQ>;
    do: RequestHandler<REQ, RES, M>;
}

export interface Spy<REQ extends IncomingMessage, M extends Middleware> {
    when: RequestPredicate<REQ>;
    do: RequestSideEffect<REQ, M>;
}

export type MiddlewareSpec<K extends string | number | symbol = string | number | symbol> = Record<K, (req?: IncomingMessage) => any>;

export type Middleware<M extends MiddlewareSpec<string | number | symbol> = MiddlewareSpec<string | number | symbol>> = {
    [N in keyof M]: () => ReturnType<M[N]>
};

export interface MiddlewareConstructor<M extends Middleware> {
    new(req: IncomingMessage): M;
    prototype?: Partial<M>;
}
