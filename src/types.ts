import { IncomingMessage, ServerResponse } from "http";

// utils
/**
 * A utility type that represents the union of the types that are values in the given record.
 * e.g. ValuesOf<{ a: string, b: number }> ≡ string | number
 */
export type ValuesOf<R extends Record<keyof any, unknown>> = R[keyof R];

// Router

/**
 * A Router.
 * The Req, Res, & Context type parameters can be set by you.
 * There's no need to set the Q or M type parameters
 * because the defaults are based on the other type parameters and will be correct.
 * The Context is expected to be the Quelaag of a parent Router.
 * A top-level Router won't have a parent, so the default Context is undefined.
 */
export interface Router<
    Req = IncomingMessage,
    Res = ServerResponse,
    Context = undefined,
    // Q is intended to be inferred from the constructor argument
    Q extends Quelaag<Req, Context> = Quelaag<Req, Context>,
    // easiest way to derive the middleware used in the Quelaag given to the constructor
    M extends ReturnType<Q> = ReturnType<Q>,
> {
    /**
     * Add a new endpoint responsible for handling the response to a request.
     */
    addEndpoint(handler: Endpoint<Req, Res, Context, M>): void;

    /**
     * Add a new spy to observe incoming requests.
     */
    addSpy(handler: Spy<Req, Context, M>): void;

    /**
     * Delegate routing entirely to another Router.
     */
    addSubRouter(handler: SubRouterEndpoint<Req, Res, Context, M>): void;

    /**
     * Not intended for public use.
     */
    _routeWithContext(req: Req, res: Res, context: Context): void;

    /**
     * Define the endpoint that will handle responding to a request,
     * when the request matches no other endpoint.
     */
    setFallbackEndpoint(handler: Fallback<Req, Res, Context, M> | undefined): void;

    /**
     * The underlying Quelaag that this router uses to create middleware function objects.
     */
    quelaag: Q;
}

/**
 * This is just Router, but with a `Context` of `undefined`.
 * It adds the `route` method so that you can route without passing in an `undefined` context superfluously.
 * This might be unnecessary one day: https://github.com/Microsoft/TypeScript/issues/12400
 * This is worth doing for the sake of having an API that is easier to understand.
 */
export interface RouterTop<
    Req = IncomingMessage,
    Res = ServerResponse,
    Q extends Quelaag<Req, any> = Quelaag<Req, unknown>,
>
    extends Router<Req, Res, undefined, Q, ReturnType<Q>>
{
    route(req: Req, res: Res): void;
}

// callbacks

/**
 * A function to handle a response object.
 */
export interface Responder<
    Req,
    Res,
    Context,
    M extends Middleware<Req, Context>,
> {
    (req: Req, res: Res, middleware: M): void | Promise<void>
}

/**
 * A function to do something with a request.
 */
export interface RequestSideEffect<
    Req,
    Context,
    M extends Middleware<Req, Context>,
> {
    (req: Req, middleware: M): void;
}

/**
 * A predicate based on a request.
 */
export interface RequestPredicate<
    Req,
    Context,
    M extends Middleware<Req, Context>,
> {
    (req: Req, middleware: M): boolean | Promise<boolean>;
}

// catching

/**
 * The catcher portion of an Endpoint or Fallback.
 */
export interface EndpointCatch<Req, Res> {
    catch?: (error: unknown, req: Req, res: Res) => void;
}

/**
 * The catcher portion of a Spy.
 */
export interface SpyCatch<Req> {
    catch?: (error: unknown, req: Req) => void;
}

// endpoint

export interface Endpoint<
    Req,
    Res,
    Context,
    M extends Middleware<Req, Context>,
> extends EndpointCatch<Req, Res>
{
    when: RequestPredicate<Req, Context, M>;
    do: Responder<Req, Res, Context, M>;
}

/**
 * A valid argument to the fallback endpoint function.
 * Essentially either an Endpoint with only the "do" function,
 * or simply a valid "do" function i.e. a RequestHandler.
 */
export type Fallback<Req, Res, Context, M extends Middleware<Req, Context>> =
    FallbackEndpoint<Req, Res, Context, M>
    | Responder<Req, Res, Context, M>;

export interface FallbackEndpoint<
    Req,
    Res,
    Context,
    M extends Middleware<Req, Context>,
> extends EndpointCatch<Req, Res>
{
    do: Responder<Req, Res, Context, M>;
}

// spy

export interface Spy<
    Req,
    Context,
    M extends Middleware<Req, Context>,
> extends SpyCatch<Req>
{
    when: RequestPredicate<Req, Context, M>;
    do: RequestSideEffect<Req, Context, M>;
}

// subrouter

export interface SubRouterEndpoint<
    Req,
    Res,
    Context,
    M extends Middleware<Req, Context>,
> {
    when: RequestPredicate<Req, Context, M>;
    router: () => Router<Req, Res, M>; // this is a function to allow a super and sub router to reference each other
}

// middleware

/**
 * An object containing function definitions to be turned into a Quelaag.
 */
export type MiddlewareSpec<
    Req,
    Context,
    K extends keyof any = keyof any,
>
    = Record<K, (req: Req, context: Context) => unknown>;

/**
 * An object of memoised functions that have a request object (and context) baked into them.
 */
export type Middleware<
    Req,
    Context,
    Spec extends MiddlewareSpec<Req, Context> = MiddlewareSpec<Req, Context>
> = {
    [N in keyof Spec]: () => ReturnType<Spec[N]>
};

// The request and context types are inferred from the middleware
// to cut down on repetition of type parameters.
// The middleware needs to be a type parameter
// so that the exact subtype of Middleware will be inferred by typescript.
export type Quelaag<
    Req = IncomingMessage,
    Context = undefined,
    Spec extends MiddlewareSpec<Req, Context> = MiddlewareSpec<Req, Context>,
> =
    (
        req: Req,
        context: Context,
    ) => Middleware<Req, Context, Spec>;

export type QuelaagReq<Q extends Quelaag<any, any>> = (Q extends Quelaag<infer R, any, any> ? R : never);
export type QuelaagContext<Q extends Quelaag<any, any>> = (Q extends Quelaag<any, infer C, any> ? C : never);
