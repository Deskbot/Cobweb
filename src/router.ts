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

        // be sure to catch errors that occur during the `do` function
        try {
            var result = endpoint.do(req, res, middleware);
        } catch (err) {
            this.callEndpointCatch(endpoint, err, req, res);
            return;
        }

        // be sure to catch errors that occur while the returned promise is resolving
        if (result instanceof Promise) {
            result.catch(err => this.callEndpointCatch(endpoint, err, req, res));
        }
    }

    private async callSpies(req: Req, middleware: M) {
        for (const spy of this.spies) {

            // be sure to catch errors that occur during the `when` function
            try {
                var when = spy.when(req, middleware);
            } catch (err) {
                this.callSpyCatch(spy, err, req);
                continue;
            }

            // when returned promise
            // be sure to catch errors that occur while the returned promise is resolving
            if (when instanceof Promise) {
                try {
                    if (await when) {
                        spy.do(req, middleware);
                    }

                } catch (err) {
                    this.callSpyCatch(spy, err, req);
                }

                // whether this spy was called or not called or errored,
                // continue looking for spies to call
                continue;
            }

            // when returned boolean
            else if (when) {

                // be sure to catch errors that occur during the `do` function
                try {
                    var result = spy.do(req, middleware);
                } catch (err) {
                    this.callSpyCatch(spy, err, req);
                    continue;
                }

                // be sure to catch errors that occur while the returned promise is resolving
                if (result instanceof Promise) {
                    result.catch(err => this.callSpyCatch(spy, err, req));
                }

                // whether this spy was called or not called or errored,
                // continue looking for spies to call
                continue;
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

            // be sure to catch errors that occur during the `when` function
            try {
                var isWhen = endpoint.when(req, middleware);
            } catch (err) {
                this.callEndpointCatch(endpoint, err, req, res);
                return;
            }

            // when returned promise
            if (isWhen instanceof Promise) {

                // be sure to catch errors that occur while the returned promise is resolving
                try {
                    if (await isWhen) {
                        userEndpoint = endpoint;
                        break;
                    } else {
                        continue;
                    }
                } catch (err) {
                    this.callEndpointCatch(endpoint, err, req, res);
                    return;
                }
            }

            // when returned boolean
            else if (isWhen) {
                userEndpoint = endpoint;
                break;
            } else {
                continue;
            }
        }

        return userEndpoint ?? this.fallbackEndpoint;
    }

    _routeWithContext(req: Req, res: Res, context: Context) {
        const middlewareInventory = this.quelaag(req, context) as M;
        this.callSpies(req, middlewareInventory);
        this.callEndpoint(req, res, middlewareInventory);
    }

    private callEndpointCatch(
        maybeCatcher: EndpointCatch<Req, Res>,
        err: unknown,
        req: Req,
        res: Res,
    ) {
        if (maybeCatcher.catch) {
            maybeCatcher.catch(err, req, res);
        } else if (this.catcher) {
            this.catcher(err);
        } else {
            throw err;
        }
    }

    private callSpyCatch(
        maybeCatcher: SpyCatch<Req>,
        err: unknown,
        req: Req
    ) {
        if (maybeCatcher.catch) {
            maybeCatcher.catch(err, req);
        } else if (this.catcher) {
            this.catcher(err);
        } else {
            throw err;
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
