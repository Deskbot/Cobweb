import { IncomingMessage, ServerResponse } from "http";

export interface RequestHandler<M extends Middleware, Req = IncomingMessage, Res = ServerResponse> {
    (req: Req, res: Res, middleware: M): void
}

export interface RequestSideEffect<M extends Middleware, Req = IncomingMessage> {
    (req: Req, middlewares: M): void;
}

export interface RequestPredicate<Req = IncomingMessage> {
    (req: Req): boolean | Promise<boolean>;
}

export interface Endpoint<M extends Middleware, Req = IncomingMessage, Res = ServerResponse> {
    when: RequestPredicate<Req>;
    do: RequestHandler<M, Req, Res>;
}

export interface Spy<M extends Middleware, Req = IncomingMessage> {
    when: RequestPredicate<Req>;
    do: RequestSideEffect<M, Req>;
}

export type MiddlewareSpec<
    K extends string | number | symbol = any,
    I = IncomingMessage,
>
    = Record<K, (req?: I) => any>;

export type Middleware<Spec extends MiddlewareSpec<string | number | symbol, Req> = any, Req = IncomingMessage> = {
    [N in keyof Spec]: () => ReturnType<Spec[N]>
};

export interface MiddlewareConstructor<M extends Middleware<any, Req>, Req = IncomingMessage> {
    new(req: Req): M;
    prototype?: Partial<M>;
}
