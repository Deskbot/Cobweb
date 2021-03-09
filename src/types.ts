import { IncomingMessage, ServerResponse } from "http";

export interface RequestHandler<
    Context,
    Req = IncomingMessage,
    Res = ServerResponse,
    M extends Middleware<Context, Req> = Middleware<Context, Req>,
> {
    (req: Req, res: Res, middleware: M): void | Promise<void>
}

export interface RequestSideEffect<
    Context,
    Req = IncomingMessage,
    M extends Middleware<Context, Req> = Middleware<Context, Req>,
> {
    (req: Req, middleware: M): void;
}

export interface RequestPredicate<
    Context,
    Req = IncomingMessage,
    M extends Middleware<Context, Req> = Middleware<Context, Req>,
> {
    (req: Req, middleware: M): boolean | Promise<boolean>;
}

export interface EndpointCatch<Req = IncomingMessage, Res = ServerResponse> {
    catch?: (error: any, req: Req, res: Res) => void;
}

export interface SpyCatch<Req = IncomingMessage> {
    catch?: (error: any, req: Req) => void;
}

export interface Endpoint<
    Context,
    Req = IncomingMessage,
    Res = ServerResponse,
    M extends Middleware<Context, Req> = Middleware<Context, Req>,
> extends EndpointCatch<Req, Res>
{
    when: RequestPredicate<Context, Req, M>;
    do: RequestHandler<Context, Req, Res, M>;
}

export interface FallbackEndpoint<
    Context,
    Req = IncomingMessage,
    Res = ServerResponse,
    M extends Middleware<Context, Req> = Middleware<Context, Req>,
> extends EndpointCatch<Req, Res>
{
    do: RequestHandler<Context, Req, Res, M>;
}

export interface Spy<
    Context,
    Req = IncomingMessage,
    M extends Middleware<Req, Context> = Middleware<Req, Context>,
> extends SpyCatch<Req>
{
    when: RequestPredicate<Context, Req, M>;
    do: RequestSideEffect<Context, Req, M>;
}

export type MiddlewareSpec<
    Context,
    Req = IncomingMessage,
    K extends keyof any = keyof any,
>
    = Record<K, (req: Req, context: Context) => any>;

export type Middleware<
    Context,
    Req,
    Spec extends MiddlewareSpec<Context, Req, keyof any> = any
> = {
    [N in keyof Spec]: () => ReturnType<Spec[N]>
};

export type Quelaag<
    Context,
    Req = IncomingMessage,
    M extends Middleware<Req, Context> = Middleware<Req, Context>,
> =
    (req: Req, context?: Context) => M;
