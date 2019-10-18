import { Endpoint, Observer } from "./types";
import { RequestListener, IncomingMessage, ServerResponse } from "http";

export class ServerBuilder {
    private endpoints: Endpoint[];
    private observers: Observer[];
    private noEndpointHandler: RequestListener | undefined;

    constructor() {
        this.endpoints = [];
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

        const requestListenerBuilder = new RequestListenerBuilder(endpoints, observers, this.noEndpointHandler);
        return (req, res) => requestListenerBuilder.run(req, res);
    }

    setNoEndpointHandler(handler: RequestListener) {
        this.noEndpointHandler = handler;
    }
}

class RequestListenerBuilder {
    private endpoints: Endpoint[];
    private observers: Observer[];
    private noEndpointHandler: RequestListener | undefined;

    constructor(endpoints: Endpoint[], observers: Observer[], noEndpointHandler?: RequestListener) {
        this.endpoints = endpoints;
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
            endpointToCall(req, res);
        }
    }

    private callObservers(req: IncomingMessage) {
        for (const observer of this.observers) {
            const condition = observer.when(req);
            if (condition instanceof Promise) {
                condition.then(() => {
                    observer.do(req);
                });
            } else {
                observer.do(req);
            }
        }
    }
}
