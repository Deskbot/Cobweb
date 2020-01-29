import { Endpoint, Spy, Middleware, RequestHandler, MiddlewareSpec, MiddlewareConstructor } from "./types";
import { IncomingMessage, ServerResponse } from "http";

export class Quelaag<I = IncomingMessage, R = ServerResponse, S extends MiddlewareSpec<any, I> = any, M extends Middleware<any, S> = any> {
    private endpoints: Endpoint<M, I, R>[];
    private MiddlewareInventory: MiddlewareConstructor<M, I>;
    private spies: Spy<M, I>[];
    private noEndpointHandler: RequestHandler<M, I, R> | undefined;

    constructor(middlewareSpec: S) {
        this.endpoints = [];
        this.spies = [];

        this.MiddlewareInventory = this.middlewareSpecToConstructor(middlewareSpec);
    }

    addEndpoint(handler: Endpoint<M, I, R>) {
        this.endpoints.push(handler);
    }

    addSpy(handler: Spy<M, I>) {
        this.spies.push(handler);
    }

    private callEndpoints(req: I, res: R, middleware: M) {
        const endpointFound = this.endpoints.find(endpoint => endpoint.when(req));

        let endpointToCall = this.noEndpointHandler;

        if (endpointFound !== undefined) {
            endpointToCall = endpointFound.do;
        }

        if (endpointToCall !== undefined) {
            endpointToCall(req, res, middleware);
        }
    }

    private callSpies(req: I, middleware: M) {
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

    handle(req: I, res: R): void {
        const middlewareInventory = new this.MiddlewareInventory(req);

        this.callSpies(req, middlewareInventory);
        this.callEndpoints(req, res, middlewareInventory);
    }

    private middlewareSpecToConstructor(middlewareSpec: S): MiddlewareConstructor<M, I> {
        const middlewareInventoryProto = {} as any;

        for (const name in middlewareSpec) {
            middlewareInventoryProto[name] = function () {
                const result = middlewareSpec[name](this.__req);
                // overwrite this function for any future uses
                this[name] = () => result;
                return result;
            }
        }

        function constructor(this: any, req: I) {
            this.__req = req;
        };

        constructor.prototype = middlewareInventoryProto;

        return constructor as any;
    }

    setFallbackEndpoint(handler: RequestHandler<M, I, R> | undefined) {
        this.noEndpointHandler = handler;
    }
}
