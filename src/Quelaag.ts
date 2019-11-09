import { Endpoint, Observer, Middleware, RequestHandler, MiddlewareSpec, MiddlewareConstructor } from "./types";
import { IncomingMessage, ServerResponse } from "http";

export class Quelaag<S extends MiddlewareSpec, M extends Middleware<S> = Middleware<S>> {
    private endpoints: Endpoint<M>[];
    private MiddlewareInventory: MiddlewareConstructor<M>;
    private observers: Observer<M>[];
    private noEndpointHandler: RequestHandler<M> | undefined;

    constructor(middlewareSpec: S) {
        this.endpoints = [];
        this.observers = [];

        this.MiddlewareInventory = middlewareSpecToConstructor<S,M>(middlewareSpec);
    }

    addEndpoint(handler: Endpoint<M>) {
        this.endpoints.push(handler);
    }

    addObserver(handler: Observer<M>) {
        this.observers.push(handler);
    }

    private callEndpoints(req: IncomingMessage, res: ServerResponse, middleware: M) {
        const endpointFound = this.endpoints.find(endpoint => endpoint.when(req));

        let endpointToCall = this.noEndpointHandler;

        if (endpointFound !== undefined) {
            endpointToCall = endpointFound.do;
        }

        if (endpointToCall !== undefined) {
            endpointToCall(req, res, middleware);
        }
    }

    private callObservers(req: IncomingMessage, middleware: M) {
        for (const observer of this.observers) {
            const condition = observer.when(req);
            if (condition instanceof Promise) {
                condition.then(() => {
                    observer.do(req, middleware);
                });
            } else {
                observer.do(req, middleware);
            }
        }
    }

    handle(req: IncomingMessage, res: ServerResponse): void {
        const middlewareInventory = new this.MiddlewareInventory(req);

        this.callObservers(req, middlewareInventory);
        this.callEndpoints(req, res, middlewareInventory);
    }

    setFallbackEndpoint(handler: RequestHandler<M> | undefined) {
        this.noEndpointHandler = handler;
    }
}

function middlewareSpecToConstructor<S extends MiddlewareSpec, M extends Middleware<S>>(middlewareSpec: S): MiddlewareConstructor<M> {
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
