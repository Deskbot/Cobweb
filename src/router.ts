import { IncomingMessage, ServerResponse } from "http";
import { Endpoint, EndpointCatch, FallbackEndpoint, Quelaag, RequestHandler, Spy, SpyCatch } from "./types";

export class Router<
    Context,
    Req = IncomingMessage,
    Res = ServerResponse,
    // Q is intended to be inferred from the constructor argument
    Q extends Quelaag<Context, Req> = Quelaag<Context, Req>,
    // easiest way to derive the middleware used in the Quelaag given to the constructor
    M extends ReturnType<Q> = ReturnType<Q>,
> {
    private catcher: ((error: unknown) => void) | undefined;
    private endpoints: Endpoint<Context, Req, Res, M>[];
    private fallbackEndpoint: FallbackEndpoint<Context, Req, Res, M> | undefined;
    private quelaag: Q;
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

    handle(req: Req, res: Res, context: Context): void {
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

    setFallbackEndpoint(handler: FallbackEndpoint<Context, Req, Res, M> | RequestHandler<Context, Req, Res, M> | undefined) {
        if (typeof handler === "function") {
            this.fallbackEndpoint = {
                do: handler,
            };
        } else {
            this.fallbackEndpoint = handler;
        }
    }
}

export default Router;
