import { Endpoint, Listener, ResponseHandler } from "./types";

export class ServerBuilder {
    private endpoints: Endpoint[];
    private listeners: Listener[];
    private noEndpointHandler: ResponseHandler | undefined;

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

    build(): ResponseHandler {
        // ensure that if build gets called again that the build handler isn't changed
        const endpoints = [...this.endpoints];
        const listeners = [...this.listeners];

        return (req, res) => {
            const endpointFound = endpoints.find(endpoint => endpoint.condition(req));

            let endpointToCall = this.noEndpointHandler;

            if (endpointFound !== undefined) {
                endpointToCall = endpointFound.handler;
            }

            if (endpointToCall !== undefined) {
                endpointToCall(req, res);
            }

            // call listeners as soon as the predicate result is available

            for (const listener of listeners) {
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

    setNoEndpointHandler(handler: ResponseHandler) {
        this.noEndpointHandler = handler;
    }
}
