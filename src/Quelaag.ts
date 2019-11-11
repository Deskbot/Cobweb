import { Endpoint, Spy, Middleware, RequestHandler, MiddlewareSpec, MiddlewareConstructor } from "./types";
import { IncomingMessage, ServerResponse } from "http";

export class Quelaag<
    REQ extends IncomingMessage,
    RES extends ServerResponse,
    S extends MiddlewareSpec<REQ>,
    M extends Middleware<REQ, S> = Middleware<REQ, S>
> {
    private endpoints: Endpoint<REQ, RES, M>[];
    private MiddlewareInventory: MiddlewareConstructor<REQ, M>;
    private spies: Spy<REQ, M>[];
    private noEndpointHandler: RequestHandler<REQ, RES, M> | undefined;

    constructor(middlewareSpec: S) {
        this.endpoints = [];
        this.spies = [];

        this.MiddlewareInventory = this.middlewareSpecToConstructor(middlewareSpec);
    }

    addEndpoint(handler: Endpoint<REQ, RES, M>) {
        this.endpoints.push(handler);
    }

    addSpy(handler: Spy<REQ, M>) {
        this.spies.push(handler);
    }

    private callEndpoints(req: REQ, res: RES, middleware: M) {
        const endpointFound = this.endpoints.find(endpoint => endpoint.when(req));

        let endpointToCall = this.noEndpointHandler;

        if (endpointFound !== undefined) {
            endpointToCall = endpointFound.do;
        }

        if (endpointToCall !== undefined) {
            endpointToCall(req, res, middleware);
        }
    }

    private callSpies(req: REQ, middleware: M) {
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

    handle(req: REQ, res: RES): void {
        const middlewareInventory = new this.MiddlewareInventory(req);

        this.callSpies(req, middlewareInventory);
        this.callEndpoints(req, res, middlewareInventory);
    }

    private middlewareSpecToConstructor(middlewareSpec: S): MiddlewareConstructor<REQ, M> {
        const middlewareInventoryProto = {} as any;

        for (const name in middlewareSpec) {
            middlewareInventoryProto[name] = function () {
                const result = middlewareSpec[name](this.__req);
                // overwrite this function for any future uses
                this[name] = () => result;
                return result;
            }
        }

        function constructor(this: any, req: IncomingMessage) {
            this.__req = req;
        };

        constructor.prototype = middlewareInventoryProto;

        return constructor as any;
    }

    setFallbackEndpoint(handler: RequestHandler<REQ, RES, M> | undefined) {
        this.noEndpointHandler = handler;
    }
}
