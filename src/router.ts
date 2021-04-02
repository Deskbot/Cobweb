import { IncomingMessage, ServerResponse } from "http";
import { subquelaag } from "./quelaag";
import { Endpoint, EndpointCatch, Fallback, FallbackEndpoint, Middleware, MiddlewareSpec, Quelaag, RouterTop, Router, Spy, SpyCatch, SubRouterEndpoint } from "./types";

class RouterImpl<
    Context,
    Req = IncomingMessage,
    Res = ServerResponse,
    // Q is intended to be inferred from the constructor argument
    Q extends Quelaag = Quelaag,
    // easiest way to derive the middleware used in the Quelaag given to the constructor
    M extends ReturnType<Q> = ReturnType<Q>,
>
    implements Router<Context, Req, Res, Q, M>
{
    private catcher: ((error: unknown) => void) | undefined;
    private endpoints: Endpoint<Context, Req, Res, M>[];
    private fallbackEndpoint: FallbackEndpoint<Context, Req, Res, M> | undefined;
    readonly quelaag: Q;
    private spies: Spy<Context, Req, M>[];

    /**
     * Create a Quelaag web server handler.
     * @param quelaag The function that constructs a memoised object of middleware functions.
     * @param catcher Respond to an error that occurs anywhere within endpoints, spies, and middleware.
     *                The `this` parameter of the function will be stripped.
     */
    constructor(quelaag: Q, catcher?: (error: unknown) => void) {
        this.catcher = catcher;
        this.endpoints = [];
        this.quelaag = quelaag;
        this.spies = [];
    }

    addEndpoint(handler: Endpoint<Context, Req, Res, M>) {
        this.endpoints.push(handler);
    }

    addSpy(handler: Spy<Context, Req, M>) {
        this.spies.push(handler);
    }

    addSubRouter(handler: SubRouterEndpoint<Context, Req, Res, M>) {
        this.endpoints.push({
            when: handler.when,
            do: (req, res, m) => {
                handler.router().routeWithContext(req, res, m);
            }
        });
    }

    private async callEndpoint(req: Req, res: Res, middleware: M) {
        const endpoint = await this.getEndpointToCall(req, res, middleware);

        if (!endpoint) {
            return;
        }

        try {
            var result = endpoint.do(req, res, middleware);
        } catch (err) {
            this.handleEndpointThrow(endpoint, err, req, res);
            return;
        }

        if (result instanceof Promise && endpoint.catch) {
            this.handleReject(endpoint, result, req, res);
        }
    }

    private async callSpies(req: Req, middleware: M) {
        for (const spy of this.spies) {
            try {
                var when = spy.when(req, middleware);
            } catch (err) {
                this.handleSpyThrow(spy, err, req);
                continue;
            }

            if (when instanceof Promise) {
                if (await when) {
                    spy.do(req, middleware);
                }
            } else if (when) {
                try {
                    spy.do(req, middleware);
                } catch (err) {
                    this.handleSpyThrow(spy, err, req);
                    continue;
                }
            }
        }
    }

    private async getEndpointToCall(req: Req, res: Res, middleware: M)
        : Promise<
            Endpoint<Context, Req, Res, M>
            | FallbackEndpoint<Context, Req, Res, M>
            | undefined
        >
    {
        let userEndpoint: Endpoint<Context, Req, Res, M> | undefined;

        for (const endpoint of this.endpoints) {
            try {
                var isWhen = endpoint.when(req, middleware);
            } catch (err) {
                this.handleEndpointThrow(endpoint, err, req, res);
                return;
            }

            if (isWhen instanceof Promise) {
                // this.catcher will never reference members of this
                // if the user wants to use a function with a binded `this`
                // they should wrap it in a lambda as is normal
                this.handleReject(endpoint, isWhen, req, res);

                try {
                    if (await isWhen) {
                        userEndpoint = endpoint;
                    }
                } catch (err) {
                    this.handleEndpointThrow(endpoint, err, req, res);
                    return;
                }
            } else if (isWhen) {
                userEndpoint = endpoint;
                break;
            }
        }

        return userEndpoint ?? this.fallbackEndpoint;
    }

    routeWithContext(req: Req, res: Res, context: Context) {
        const middlewareInventory = this.quelaag(req, context) as M;
        this.callSpies(req, middlewareInventory);
        this.callEndpoint(req, res, middlewareInventory);
    }

    private handleReject(maybeCatcher: EndpointCatch<Req, Res>, promise: Promise<unknown>, req: Req, res: Res) {
        if (maybeCatcher.catch) {
            const c = maybeCatcher.catch;
            promise.catch(err => c(err, req, res));
        } else if (this.catcher) {
            promise.catch(this.catcher);
        }
    }

    private handleEndpointThrow(maybeCatcher: EndpointCatch<Req, Res>, err: unknown, req: Req, res: Res) {
        if (maybeCatcher.catch) {
            maybeCatcher.catch(err, req, res);
        } else if (this.catcher) {
            this.catcher(err);
        }
    }

    private handleSpyThrow(maybeCatcher: SpyCatch<Req>, err: unknown, req: Req) {
        if (maybeCatcher.catch) {
            maybeCatcher.catch(err, req);
        } else if (this.catcher) {
            this.catcher(err);
        }
    }

    setFallbackEndpoint(handler: Fallback<Context, Req, Res, M> | undefined) {
        if (typeof handler === "function") {
            this.fallbackEndpoint = {
                do: handler,
            };
        } else {
            this.fallbackEndpoint = handler;
        }
    }
}

/**
 * This is just RealRouter, but with a `Context` of `undefined`.
 * It overrides `handle` so that you can call it without passing in `undefined` superfluously.
 * This might be unnecessary one day: https://github.com/Microsoft/TypeScript/issues/12400
 * This is worth doing for the sake of having an API that is easier to understand.
 */
class RootRouterImpl<
    Req = IncomingMessage,
    Res = ServerResponse,
    Q extends Quelaag = Quelaag,
    M extends ReturnType<Q> = ReturnType<Q>,
>
    extends RouterImpl<undefined, Req, Res, Q, M>
    implements RouterTop<Req, Res, Q, M>
{
    // override
    route(req: Req, res: Res) {
        this.routeWithContext(req, res, undefined);
    }
}

export function router<
    Req = IncomingMessage,
    Res = ServerResponse,
    Q extends Quelaag = Quelaag,
    M extends ReturnType<Q> = ReturnType<Q>,
> (quelaag: Q, catcher?: (error: unknown) => void): RouterTop<Req, Res, Q, M> {
    return new RootRouterImpl(quelaag, catcher);
}

export function subRouter<
    ParentContext,
    ParentQ extends Quelaag = Quelaag,

    Req = (ParentQ extends Quelaag<Middleware<unknown, infer R>> ? R : never),
    Res = ServerResponse,

    ParentM extends ReturnType<ParentQ> = ReturnType<ParentQ>,

    ChildSpec extends MiddlewareSpec<ParentM, Req>
        = MiddlewareSpec<ParentM, Req>,
    SubQ extends Quelaag<Middleware<ParentM, Req, ChildSpec>>
        = Quelaag<Middleware<ParentM, Req, ChildSpec>>,

    M extends ReturnType<SubQ> = ReturnType<SubQ>,
>(
    parentRouter: Router<ParentContext, Req, Res, ParentQ, ParentM>,
    spec: ChildSpec
): Router<ParentM, Req, Res, SubQ, M>
{
    return new RouterImpl(subquelaag(parentRouter.quelaag, spec) as SubQ);
}
