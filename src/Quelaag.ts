import { Endpoint, Spy, Middleware, RequestHandler, MiddlewareSpec, MiddlewareConstructor } from "./types";
import { IncomingMessage, ServerResponse } from "http";

export class Quelaag<
    Req = IncomingMessage,
    Res = ServerResponse,
    Spec extends MiddlewareSpec<any, Req> = any,
    M extends Middleware<any, Spec> = any
> {
    private endpoints: Endpoint<M, Req, Res>[];
    private MiddlewareInventory: MiddlewareConstructor<M, Req>;
    private spies: Spy<M, Req>[];
    private noEndpointHandler: RequestHandler<M, Req, Res> | undefined;

    constructor(middlewareSpec: Spec) {
        this.endpoints = [];
        this.spies = [];

        this.MiddlewareInventory = this.middlewareSpecToConstructor(middlewareSpec);
    }

    addEndpoint(handler: Endpoint<M, Req, Res>) {
        this.endpoints.push(handler);
    }

    addSpy(handler: Spy<M, Req>) {
        this.spies.push(handler);
    }

    private callEndpoints(req: Req, res: Res, middleware: M) {
        const endpointFound = this.endpoints.find(endpoint => endpoint.when(req));

        const doFunc = endpointFound?.do ?? this.noEndpointHandler;

        if (doFunc !== undefined) {
            try {
                var result = doFunc(req, res, middleware);
            } catch (err) {
                endpointFound?.catch(err);
                return;
            }

            if (result instanceof Promise && endpointFound?.catch) {
                result.catch(endpointFound.catch);
            }
        }
    }

    private callSpies(req: Req, middleware: M) {
        for (const spy of this.spies) {
            const condition = spy.when(req);
            if (condition instanceof Promise) {
                condition.then(() => {
                    spy.do(req, middleware);
                });
            } else {
                spy.do(req, middleware);
            }
        }
    }

    handle(req: Req, res: Res): void {
        const middlewareInventory = new this.MiddlewareInventory(req);

        this.callSpies(req, middlewareInventory);
        this.callEndpoints(req, res, middlewareInventory);
    }

    private middlewareSpecToConstructor(middlewareSpec: Spec): MiddlewareConstructor<M, Req> {
        const middlewareInventoryProto = {} as any;

        for (const name in middlewareSpec) {
            middlewareInventoryProto[name] = function () {
                const result = middlewareSpec[name](this.__req);
                // overwrite this function for any future uses
                this[name] = () => result;
                return result;
            }
        }

        function constructor(this: any, req: Req) {
            this.__req = req;
        };

        constructor.prototype = middlewareInventoryProto;

        return constructor as any;
    }

    setFallbackEndpoint(handler: RequestHandler<M, Req, Res> | undefined) {
        this.noEndpointHandler = handler;
    }
}
