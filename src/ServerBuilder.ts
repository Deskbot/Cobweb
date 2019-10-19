import { Endpoint, Observer, MiddlewareInventory, RequestHandler } from "./types";
import { RequestListener, IncomingMessage, ServerResponse } from "http";

export class ServerBuilder<M extends MiddlewareInventory> {
    private endpoints: Endpoint[];
    private readonly middleware: M;
    private observers: Observer[];
    private noEndpointHandler: RequestHandler | undefined;

    constructor(middleware: M) {
        this.endpoints = [];
        this.middleware = middleware;
        this.observers = [];
    }

    addEndpoint(handler: Endpoint) {
        this.endpoints.push(handler);
    }

    addObserver(handler: Observer) {
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

    setNoEndpointHandler(handler: RequestHandler) {
        this.noEndpointHandler = handler;
    }
}

class RequestListenerBuilder {
    private endpoints: Endpoint[];
    private middlewares: MiddlewareInventory;
    private observers: Observer[];
    private noEndpointHandler: RequestHandler | undefined;

    constructor(
        endpoints: Endpoint[],
        observers: Observer[],
        middlewares: MiddlewareInventory,
        noEndpointHandler?: RequestHandler
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
