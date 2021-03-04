import { IncomingMessage, ServerResponse } from "http";

export interface RequestHandler<M extends Middleware<Req>, Req = IncomingMessage, Res = ServerResponse> {
    (req: Req, res: Res, middleware: M): void | Promise<void>
}

export interface RequestSideEffect<M extends Middleware<Req>, Req = IncomingMessage> {
    (req: Req, middleware: M): void;
}

export interface RequestPredicate<M extends Middleware<Req>, Req = IncomingMessage> {
    (req: Req, middleware: M): boolean | Promise<boolean>;
}

export interface EndpointCatch<Req = IncomingMessage, Res = ServerResponse> {
    catch?: (error: any, req: Req, res: Res) => void;
}

export interface SpyCatch<Req = IncomingMessage> {
    catch?: (error: any, req: Req) => void;
}

export interface Endpoint<M extends Middleware<Req>, Req = IncomingMessage, Res = ServerResponse> extends EndpointCatch<Req, Res> {
    when: RequestPredicate<M, Req>;
    do: RequestHandler<M, Req, Res>;
}

export interface FallbackEndpoint<M extends Middleware<Req>, Req = IncomingMessage, Res = ServerResponse> extends EndpointCatch<Req, Res> {
    do: RequestHandler<M, Req, Res>;
}

export interface Spy<M extends Middleware<Req>, Req = IncomingMessage> extends SpyCatch<Req> {
    when: RequestPredicate<M, Req>;
    do: RequestSideEffect<M, Req>;
}

export type MiddlewareSpec<
    K extends keyof any = any,
    Req = IncomingMessage,
>
    = Record<K, (req: Req) => any>;

export type Middleware<Req, Spec extends MiddlewareSpec<keyof any, Req> = any> = {
    [N in keyof Spec]: () => ReturnType<Spec[N]>
};

export type Quelaag<M extends Middleware<Req>, Req = IncomingMessage> =
    (req: Req) => M
