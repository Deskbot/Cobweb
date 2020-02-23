import { IncomingMessage, ServerResponse } from "http";

export interface RequestHandler<M extends Middleware<Req>, Req = IncomingMessage, Res = ServerResponse> {
    (req: Req, res: Res, middleware: M): void | Promise<void>
}

export interface RequestSideEffect<M extends Middleware<Req>, Req = IncomingMessage> {
    (req: Req, middlewares: M): void;
}

export interface RequestPredicate<Req = IncomingMessage> {
    (req: Req): boolean | Promise<boolean>;
}

export interface Endpoint<M extends Middleware<Req>, Req = IncomingMessage, Res = ServerResponse> {
    when: RequestPredicate<Req>;
    do: RequestHandler<M, Req, Res>;
    catch?: (error: any) => void;
}

export interface FallbackEndpoint<M extends Middleware<Req>, Req = IncomingMessage, Res = ServerResponse> {
    do: RequestHandler<M, Req, Res>;
    catch?: (error: any) => void;
}

export interface Spy<M extends Middleware<Req>, Req = IncomingMessage> {
    when: RequestPredicate<Req>;
    do: RequestSideEffect<M, Req>;
    catch?: (error: any) => void;
}

export type MiddlewareSpec<
    K extends string | number | symbol = any,
    Req = IncomingMessage,
>
    = Record<K, (req: Req) => any>;

export type Middleware<Req, Spec extends MiddlewareSpec<string | number | symbol, Req> = any> = {
    [N in keyof Spec]: () => ReturnType<Spec[N]>
};

export interface MiddlewareConstructor<M extends Middleware<Req>, Req = IncomingMessage> {
    new(req: Req): M;
    prototype?: Partial<M>;
}
