import { IncomingMessage, ServerResponse } from "http";
import { Endpoint, EndpointCatch, FallbackEndpoint, Middleware, MiddlewareSpec, Quelaag, RequestHandler, Spy, SpyCatch } from "./types";

export class Router<
    Context,
    Req = IncomingMessage,
    Res = ServerResponse,
    Spec extends MiddlewareSpec<Context, Req> = any,
    M extends Middleware<Context, Req, Spec> = any,
    Q extends Quelaag<Context, Req, M> = any,
> {
    private catcher: ((error: any) => void) | undefined;
    private endpoints: Endpoint<M, Req, Res>[];
    private fallbackEndpoint: FallbackEndpoint<M, Req, Res> | undefined;
    private quelaag: Q;
    private spies: Spy<M, Req>[];

    /**
     * Create a Quelaag web server handler.
     * @param quelaag The function that constructs a memoised object of middleware functions.
     * @param catcher Respond to an error that occurs anywhere within endpoints, spies, and middleware.
     *                The `this` parameter of the function will be stripped.
     */
    constructor(quelaag: Q, catcher?: (error: any) => void) {
        this.catcher = catcher;
        this.endpoints = [];
        this.quelaag = quelaag;
        this.spies = [];
    }

    addEndpoint(handler: Endpoint<M, Req, Res>) {
        this.endpoints.push(handler);
    }

    addSpy(handler: Spy<M, Req>) {
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
        : Promise<Endpoint<M, Req, Res> | FallbackEndpoint<M, Req, Res> | undefined> {
        let userEndpoint: Endpoint<M, Req, Res> | undefined;

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

    handle(req: Req, res: Res): void {
        const middlewareInventory = this.quelaag(req);
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

    private handleEndpointThrow(maybeCatcher: EndpointCatch<Req, Res>, err: any, req: Req, res: Res) {
        if (maybeCatcher.catch) {
            maybeCatcher.catch(err, req, res);
        } else if (this.catcher) {
            this.catcher(err);
        }
    }

    private handleSpyThrow(maybeCatcher: SpyCatch<Req>, err: any, req: Req) {
        if (maybeCatcher.catch) {
            maybeCatcher.catch(err, req);
        } else if (this.catcher) {
            this.catcher(err);
        }
    }

    setFallbackEndpoint(handler: FallbackEndpoint<M, Req, Res> | RequestHandler<M, Req, Res> | undefined) {
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
