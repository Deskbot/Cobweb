import { Endpoint, Observer, MiddlewareInventory, RequestHandler, MiddlewareSpecification } from "./types";
import { IncomingMessage, ServerResponse } from "http";

export class ServerBuilder<M extends MiddlewareSpecification, I extends MiddlewareInventory<M> = MiddlewareInventory<M>> {
    private endpoints: Endpoint<I>[];
    private middlewares: M;
    private observers: Observer<I>[];
    private noEndpointHandler: RequestHandler<I> | undefined;

    constructor(middleware: M) {
        this.endpoints = [];
        this.middlewares = middleware;
        this.observers = [];
    }

    addEndpoint(handler: Endpoint<I>) {
        this.endpoints.push(handler);
    }

    addObserver(handler: Observer<I>) {
        this.observers.push(handler);
    }

    handle(req: IncomingMessage, res: ServerResponse): void {
        const middlewareInventory = this.specToInventory(this.middlewares, req);

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

    private specToInventory<M extends MiddlewareSpecification>(spec: M, req: IncomingMessage): I {
        const middlewareInventory = {} as any;

        for (const name in spec) {
            middlewareInventory[name] = () => {
                const result = spec[name](req);
                // overwrite this function for any future uses
                middlewareInventory[name] = () => result;
                return result;
            }
        }

        return middlewareInventory as I;
    }
}
