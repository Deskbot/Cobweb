import { IncomingMessage, ServerResponse } from "http";

// handler callbacks

export interface RequestHandler<
    Context,
    Req,
    Res,
    M extends Middleware<Context, Req>,
> {
    (req: Req, res: Res, middleware: M): void | Promise<void>
}

export interface RequestSideEffect<
    Context,
    Req,
    M extends Middleware<Context, Req>,
> {
    (req: Req, middleware: M): void;
}

export interface RequestPredicate<
    Context,
    Req,
    M extends Middleware<Context, Req>,
> {
    (req: Req, middleware: M): boolean | Promise<boolean>;
}

// handlers

// catching

export interface EndpointCatch<Req = IncomingMessage, Res = ServerResponse> {
    catch?: (error: unknown, req: Req, res: Res) => void;
}

export interface SpyCatch<Req = IncomingMessage> {
    catch?: (error: unknown, req: Req) => void;
}

// endpoint

export interface Endpoint<
    Context,
    Req,
    Res,
    M extends Middleware<Context, Req>,
> extends EndpointCatch<Req, Res>
{
    when: RequestPredicate<Context, Req, M>;
    do: RequestHandler<Context, Req, Res, M>;
}

export type Fallback<Context, Req, Res, M extends Middleware<Context, Req>> =
    FallbackEndpoint<Context, Req, Res, M> | RequestHandler<Context, Req, Res, M>;

export interface FallbackEndpoint<
    Context,
    Req,
    Res,
    M extends Middleware<Context, Req>,
> extends EndpointCatch<Req, Res>
{
    do: RequestHandler<Context, Req, Res, M>;
}

// spy

export interface Spy<
    Context,
    Req,
    M extends Middleware<Context, Req>,
> extends SpyCatch<Req>
{
    when: RequestPredicate<Context, Req, M>;
    do: RequestSideEffect<Context, Req, M>;
}

// middleware

export type MiddlewareSpec<
    Context,
    Req,
    K extends keyof any = keyof any,
>
    = Record<K, (req: Req, context: Context) => unknown>;

export type Middleware<
    Context,
    Req,
    Spec extends MiddlewareSpec<Context, Req> = MiddlewareSpec<Context, Req>
> = {
    [N in keyof Spec]: () => ReturnType<Spec[N]>
};

export type Quelaag<
    Context,
    Req,
    M extends Middleware<Context, Req> = Middleware<Context, Req>,
    // M is needed as a generic
    // to allow typescript to infer exactly which Middleware this is
    // and not just the most generic one, with "any" as the Spec.
> =
    (req: Req, context: Context) => M;
