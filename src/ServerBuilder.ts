import { Endpoint, Observer, MiddlewareInventory, RequestHandler } from "./types";
import { RequestListener, IncomingMessage, ServerResponse } from "http";

export class ServerBuilder<M extends MiddlewareInventory<string>> {
    private endpoints: Endpoint<M>[];
    private readonly middleware: M;
    private observers: Observer<M>[];
    private noEndpointHandler: RequestHandler<M> | undefined;

    constructor(middleware: M) {
        this.endpoints = [];
        this.middleware = middleware;
        this.observers = [];
    }

    addEndpoint(handler: Endpoint<M>) {
        this.endpoints.push(handler);
    }

    addObserver(handler: Observer<M>) {
        this.observers.push(handler);
    }

    build(): RequestListener {
        // ensure that if build gets called again that the build handler isn't changed
        const endpoints = [...this.endpoints];
        const observers = [...this.observers];

        const requestListenerBuilder = new RequestListenerBuilder(
            endpoints,
            observers,
            this.middleware,
            this.noEndpointHandler
        );
        return (req, res) => requestListenerBuilder.run(req, res);
    }

    setNoEndpointHandler(handler: RequestHandler<M>) {
        this.noEndpointHandler = handler;
    }
}

class RequestListenerBuilder<M extends MiddlewareInventory<string>> {
    private endpoints: Endpoint<M>[];
    private middlewares: M;
    private observers: Observer<M>[];
    private noEndpointHandler: RequestHandler<M> | undefined;

    constructor(
        endpoints: Endpoint<M>[],
        observers: Observer<M>[],
        middlewares: M,
        noEndpointHandler?: RequestHandler<M>
    ) {
        this.endpoints = endpoints;
        this.middlewares = middlewares;
        this.observers = observers;
        this.noEndpointHandler = noEndpointHandler;
    }

    run(req: IncomingMessage, res: ServerResponse): void {
        this.callObservers(req);
        this.callEndpoint(req, res);
    }

    private callEndpoint(req: IncomingMessage, res: ServerResponse) {
        const endpointFound = this.endpoints.find(endpoint => endpoint.when(req));

        let endpointToCall = this.noEndpointHandler;

        if (endpointFound !== undefined) {
            endpointToCall = endpointFound.do;
        }

        if (endpointToCall !== undefined) {
            endpointToCall(req, res, this.middlewares);
        }
    }

    private callObservers(req: IncomingMessage) {
        for (const observer of this.observers) {
            const condition = observer.when(req);
            if (condition instanceof Promise) {
                condition.then(() => {
                    observer.do(req, this.middlewares);
                });
            } else {
                observer.do(req, this.middlewares);
            }
        }
    }
}
