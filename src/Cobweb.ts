import { Endpoint, Observer, MiddlewareInventory, RequestHandler, MiddlewareSpecification, Constructor } from "./types";
import { IncomingMessage, ServerResponse } from "http";

export class Cobweb<M extends MiddlewareSpecification, I extends MiddlewareInventory<M> = MiddlewareInventory<M>> {
    private endpoints: Endpoint<I>[];
    private MiddlewareInventory: Constructor<I>;
    private observers: Observer<I>[];
    private noEndpointHandler: RequestHandler<I> | undefined;

    constructor(middlewareSpec: M) {
        this.endpoints = [];
        this.observers = [];

        // ensure the middleware don't get changed after initialisation
        middlewareSpec = { ...middlewareSpec };
        const middlewareInventoryProto = {} as any;

        for (const name in middlewareSpec) {
            middlewareInventoryProto[name] = function() {
                const result = middlewareSpec[name](this.req);
                // overwrite this function for any future uses
                this[name] = () => result;
                return result;
            }
        }

        const construct = function() { } as any;
        construct.prototype = middlewareInventoryProto;

        this.MiddlewareInventory = construct;
    }

    addEndpoint(handler: Endpoint<I>) {
        this.endpoints.push(handler);
    }

    addObserver(handler: Observer<I>) {
        this.observers.push(handler);
    }

    handle(req: IncomingMessage, res: ServerResponse): void {
        const middlewareInventory = new this.MiddlewareInventory();

        (middlewareInventory as I & { req: IncomingMessage }).req = req;

        // call observers

        for (const observer of this.observers) {
            const condition = observer.when(req);
            if (condition instanceof Promise) {
                condition.then(() => {
                    observer.do(req, middlewareInventory);
                });
            } else {
                observer.do(req, middlewareInventory);
            }
        }

        // call endpoints

        const endpointFound = this.endpoints.find(endpoint => endpoint.when(req));

        let endpointToCall = this.noEndpointHandler;

        if (endpointFound !== undefined) {
            endpointToCall = endpointFound.do;
        }

        if (endpointToCall !== undefined) {
            endpointToCall(req, res, middlewareInventory);
        }
    }

    setNoEndpointHandler(handler: RequestHandler<I>) {
        this.noEndpointHandler = handler;
    }
}
