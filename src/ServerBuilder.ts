import { Endpoint, Observer, MiddlewareInventory, RequestHandler, MiddlewareSpecification } from "./types";
import { RequestListener, IncomingMessage, ServerResponse } from "http";

export class ServerBuilder<M extends MiddlewareSpecification<string>, I extends MiddlewareInventory<M>> {
    private endpoints: Endpoint<I>[];
    private readonly middleware: M;
    private observers: Observer<I>[];
    private noEndpointHandler: RequestHandler<I> | undefined;

    constructor(middleware: M) {
        this.endpoints = [];
        this.middleware = middleware;
        this.observers = [];
    }

    addEndpoint(handler: Endpoint<I>) {
        this.endpoints.push(handler);
    }

    addObserver(handler: Observer<I>) {
        this.observers.push(handler);
    }

    build(): RequestListener {
        // ensure that if build gets called again that the build handler isn't changed
        const endpoints = [...this.endpoints];
        const observers = [...this.observers];

        const requestListenerBuilder = new RequestListenerBuilder<M,I>(
            endpoints,
            observers,
            this.middleware,
            this.noEndpointHandler
        );
        return (req, res) => requestListenerBuilder.run(req, res);
    }

    setNoEndpointHandler(handler: RequestHandler<I>) {
        this.noEndpointHandler = handler;
    }
}

class RequestListenerBuilder<M extends MiddlewareSpecification<string>, I extends MiddlewareInventory<M>> {
    private endpoints: Endpoint<I>[];
    private middlewares: I;
    private observers: Observer<I>[];
    private noEndpointHandler: RequestHandler<I> | undefined;

    constructor(
        endpoints: Endpoint<I>[],
        observers: Observer<I>[],
        middlewares: M,
        noEndpointHandler?: RequestHandler<I>
    ) {
        this.endpoints = endpoints;
        this.middlewares = middlewares as any; // todo properly type and transform
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
