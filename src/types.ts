// handler callbacks

import { IncomingMessage, ServerResponse } from "http";

// Router

export interface Router<
    Context,
    Req = IncomingMessage,
    Res = ServerResponse,
    // Q is intended to be inferred from the constructor argument
    Q extends Quelaag = Quelaag,
    // easiest way to derive the middleware used in the Quelaag given to the constructor
    M extends ReturnType<Q> = ReturnType<Q>,
> {
    addEndpoint(handler: Endpoint<Context, Req, Res, M>): void;
    addSpy(handler: Spy<Context, Req, M>): void;
    addSubRouter(handler: SubRouterEndpoint<Context, Req, Res, M>): void;
    setFallbackEndpoint(handler: Fallback<Context, Req, Res, M> | undefined): void;
    quelaag: Q;
}

export interface RootRouter<
    Req = IncomingMessage,
    Res = ServerResponse,
    Q extends Quelaag = Quelaag,
    M extends ReturnType <Q> = ReturnType <Q>,
>
    extends Router<undefined, Req, Res, Q, M>
{
    handle(req: Req, res: Res): void;
}

export interface SubRouter<
    Context,
    Req = IncomingMessage,
    Res = ServerResponse,
    Q extends Quelaag = Quelaag,
    M extends ReturnType<Q> = ReturnType<Q>,
>
    extends Router<Context, Req, Res, Q, M>
{
    handle(req: Req, res: Res, context: Context): void;
}

// callbacks

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

// catching

export interface EndpointCatch<Req, Res> {
    catch?: (error: unknown, req: Req, res: Res) => void;
}

export interface SpyCatch<Req> {
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

// subrouter

export interface SubRouterEndpoint<
    Context,
    Req,
    Res,
    M extends Middleware<Context, Req>,
> {
    when: RequestPredicate<Context, Req, M>;
    router: () => SubRouter<M, Req, Res>; // this is a function to allow a super and sub router to reference each other
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

// The request and context types are inferred from the middleware
// to cut down on repetition of type parameters.
// The middleware needs to be a type parameter
// so that the exact subtype of Middleware will be inferred by typescript.
export type Quelaag<
    M extends Middleware<unknown, unknown> = Middleware<unknown, unknown>,
> =
    (
        req: (M extends Middleware<unknown, infer Req> ? Req : never),
        context: (M extends Middleware<infer Con, unknown> ? Con : never)
    ) => M;
