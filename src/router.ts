import { IncomingMessage, ServerResponse } from "http";
import { subquelaag } from "./quelaag";
import { Endpoint, EndpointCatch, Fallback, FallbackEndpoint, MiddlewareSpec, Quelaag, Router, RouterTop, Spy, SpyCatch, SubRouterEndpoint } from "./types";

class RouterImpl<
    Req,
    Res,
    Context,
    // Q is intended to be inferred from the constructor argument
    Q extends Quelaag<Req, Context>,
    // easiest way to derive the middleware used in the Quelaag given to the constructor
    M extends ReturnType<Q> = ReturnType<Q>,
>
    implements Router<Req, Res, Context, Q, M>
{
    private catcher: ((error: unknown) => void) | undefined;
    private endpoints: Endpoint<Req, Res, Context, M>[];
    private fallbackEndpoint: FallbackEndpoint<Req, Res, Context, M> | undefined;
    readonly quelaag: Q;
    private spies: Spy<Req, Context, M>[];

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

    addEndpoint(handler: Endpoint<Req, Res, Context, M>) {
        this.endpoints.push(handler);
    }

    addSpy(handler: Spy<Req, Context, M>) {
        this.spies.push(handler);
    }

    addSubRouter(handler: SubRouterEndpoint<Req, Res, Context, M>) {
        this.endpoints.push({
            when: handler.when,
            do: (req, res, m) => {
                handler.router()._routeWithContext(req, res, m);
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

        if (result instanceof Promise) {
            this.handleEndpointReject(endpoint, result, req, res);
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
                    var result = spy.do(req, middleware);
                } catch (err) {
                    this.handleSpyThrow(spy, err, req);
                    continue;
                }

                if (result instanceof Promise) {
                    this.handleSpyReject(spy, result, req);
                }
            }
        }
    }

    private async getEndpointToCall(req: Req, res: Res, middleware: M)
        : Promise<
            Endpoint<Req, Res, Context, M>
            | FallbackEndpoint<Req, Res, Context, M>
            | undefined
        >
    {
        let userEndpoint: Endpoint<Req, Res, Context, M> | undefined;

        for (const endpoint of this.endpoints) {
            try {
                var isWhen = endpoint.when(req, middleware);
            } catch (err) {
                this.handleEndpointThrow(endpoint, err, req, res);
                return;
            }

            if (isWhen instanceof Promise) {
                this.handleEndpointReject(endpoint, isWhen, req, res);

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

    _routeWithContext(req: Req, res: Res, context: Context) {
        const middlewareInventory = this.quelaag(req, context) as M;
        this.callSpies(req, middlewareInventory);
        this.callEndpoint(req, res, middlewareInventory);
    }

    private handleEndpointReject(maybeCatcher: EndpointCatch<Req, Res>, promise: Promise<unknown>, req: Req, res: Res) {
        // this.catcher will never reference members of this
        // if the user wants to use a function with a binded `this`
        // they should wrap it in a lambda as is normal

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

    private handleSpyReject(maybeCatcher: SpyCatch<Req>, promise: Promise<unknown>, req: Req) {
        if (maybeCatcher.catch) {
            const c = maybeCatcher.catch;
            promise.catch(err => c(err, req));
        } else if (this.catcher) {
            promise.catch(this.catcher);
        }
    }

    private handleSpyThrow(maybeCatcher: SpyCatch<Req>, err: unknown, req: Req) {
        if (maybeCatcher.catch) {
            maybeCatcher.catch(err, req);
        } else if (this.catcher) {
            this.catcher(err);
        }
    }

    setFallbackEndpoint(handler: Fallback<Req, Res, Context, M> | undefined) {
        if (typeof handler === "function") {
            this.fallbackEndpoint = {
                do: handler,
            };
        } else {
            this.fallbackEndpoint = handler;
        }
    }
}

class RootRouterImpl<Req, Res, Q extends Quelaag<Req, undefined>>
    extends RouterImpl<Req, Res, undefined, Q>
    implements RouterTop<Req, Res, Q>
{
    route(req: Req, res: Res) {
        this._routeWithContext(req, res, undefined);
    }
}

/**
 * Create a new router.
 * You can choose a request and response type by giving type arguments to this function,
 * but if you do, you also need to provide a type argument that matches the Quelaag argument.
 * You can do this by assigning the Quelaag to a variable and using `typeof [that variable]` as the type argument.
 *
 * @param quelaag An instance of Quelaag
 * @param catcher A function to do something with uncaught errors.
 */
export function router<
    Req = IncomingMessage,
    Res = ServerResponse,
    Q extends Quelaag<Req, undefined> = Quelaag<Req, undefined>,
>(quelaag: Q, catcher?: (error: unknown) => void): RouterTop<Req, Res, Q> {
    return new RootRouterImpl(quelaag, catcher);
}

/**
 * Create a new Router and a new Quelaag for it, where the Quelaag's context is the Quelaag of the parent Router.
 * This allows you to use middleware defined in the parent Router in the created sub-Router.
 *
 * @param parentRouter An instance of Router.
 * @param spec An object of middleware functions used to define a new Quelaag.
 */
export function subRouter<
    Req = IncomingMessage,
    Res = ServerResponse,

    ParentContext = undefined,
    ParentQ extends Quelaag<Req, ParentContext>
                  = Quelaag<Req, ParentContext>,
    ParentM extends ReturnType<ParentQ>
                  = ReturnType<ParentQ>,

    ChildSpec extends MiddlewareSpec<Req, ParentM>
                    = MiddlewareSpec<Req, ParentM>,

    SubQ extends Quelaag<Req, ParentM, ChildSpec>
               = Quelaag<Req, ParentM, ChildSpec>,
>(
    parentRouter: Router<Req, Res, ParentContext, ParentQ>,
    spec: ChildSpec
): Router<Req, Res, ParentM, SubQ>
{
    return new RouterImpl(subquelaag(parentRouter.quelaag, spec) as SubQ);
}
