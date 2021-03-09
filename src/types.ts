import { IncomingMessage, ServerResponse } from "http";

export interface RequestHandler<
    Context,
    Req = IncomingMessage,
    Res = ServerResponse,
> {
    (req: Req, res: Res, middleware: Middleware<Context, Req>): void | Promise<void>
}

export interface RequestSideEffect<
    Context,
    Req = IncomingMessage,
> {
    (req: Req, middleware: Middleware<Context, Req>): void;
}

export interface RequestPredicate<
    Context,
    Req = IncomingMessage,
> {
    (req: Req, middleware: Middleware<Context, Req>): boolean | Promise<boolean>;
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
> extends EndpointCatch<Req, Res>
{
    when: RequestPredicate<Context, Req>;
    do: RequestHandler<Context, Req, Res>;
}

export interface FallbackEndpoint<
    Context,
    Req = IncomingMessage,
    Res = ServerResponse,
> extends EndpointCatch<Req, Res>
{
    do: RequestHandler<Context, Req, Res>;
}

export interface Spy<
    Context,
    Req = IncomingMessage,
> extends SpyCatch<Req>
{
    when: RequestPredicate<Context, Req>;
    do: RequestSideEffect<Context, Req>;
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
    Spec extends MiddlewareSpec<Context, Req, keyof any> = MiddlewareSpec<Context, Req, keyof any>
> = {
    [N in keyof Spec]: () => ReturnType<Spec[N]>
};

export type Quelaag<
    Context,
    Req = IncomingMessage,
    M extends Middleware<Context, Req> = Middleware<Context, Req>,
    // M is needed as a generic
    // to allow typescript to infer exactly which Middleware this is
    // and not just the most generic one, with "any" as the Spec.
> =
    (req: Req, context?: Context) => M;
