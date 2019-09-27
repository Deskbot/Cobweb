import { Endpoint, Listener } from "./types";
import { RequestListener, IncomingMessage, ServerResponse } from "http";

export class ServerBuilder {
    private endpoints: Endpoint[];
    private listeners: Listener[];
    private noEndpointHandler: RequestListener | undefined;

    constructor() {
        this.endpoints = [];
        this.listeners = [];
    }

    addEndpoint(handler: Endpoint) {
        this.endpoints.push(handler);
    }

    addListener(handler: Listener) {
        this.listeners.push(handler);
    }

    build(): RequestListener {
        // ensure that if build gets called again that the build handler isn't changed
        const endpoints = [...this.endpoints];
        const listeners = [...this.listeners];

        const requestListenerBuilder = new RequestListenerBuilder(endpoints, listeners, this.noEndpointHandler);
        return requestListenerBuilder.run;
    }

    setNoEndpointHandler(handler: RequestListener) {
        this.noEndpointHandler = handler;
    }
}

class RequestListenerBuilder {
    private endpoints: Endpoint[];
    private listeners: Listener[];
    private noEndpointHandler: RequestListener | undefined;

    constructor(endpoints: Endpoint[], listeners: Listener[], noEndpointHandler?: RequestListener) {
        this.endpoints = endpoints;
        this.listeners = listeners;
        this.noEndpointHandler = noEndpointHandler;
    }

    run(req: IncomingMessage, res: ServerResponse): void {
        this.callListeners(req);
        this.callEndpoint(req, res);
    }

    private callEndpoint(req: IncomingMessage, res: ServerResponse) {
        const endpointFound = this.endpoints.find(endpoint => endpoint.condition(req));

        let endpointToCall = this.noEndpointHandler;

        if (endpointFound !== undefined) {
            endpointToCall = endpointFound.handler;
        }

        if (endpointToCall !== undefined) {
            endpointToCall(req, res);
        }
    }

    private callListeners(req: IncomingMessage) {
        for (const listener of this.listeners) {
            const condition = listener.condition(req);
            if (condition instanceof Promise) {
                condition.then(() => {
                    listener.handler(req);
                });
            } else {
                listener.handler(req);
            }
        }
    }
}
