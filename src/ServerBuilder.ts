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

        const responseHandlerBuilder = new ResponseHandlerBuilder(endpoints, listeners, this.noEndpointHandler);
        return responseHandlerBuilder.run;
    }

    setNoEndpointHandler(handler: ResponseHandler) {
        this.noEndpointHandler = handler;
    }
}

class ResponseHandlerBuilder {
    private endpoints: Endpoint[];
    private listeners: Listener[];
    private noEndpointHandler: ResponseHandler | undefined;

    constructor(endpoints: Endpoint[], listeners: Listener[], noEndpointHandler?: ResponseHandler) {
        this.endpoints = endpoints;
        this.listeners = listeners;
        this.noEndpointHandler = noEndpointHandler;
    }

    run(req: Request, res: Response): void {
        this.callListeners(req);
        this.callEndpoint(req, res);
    }

    private callEndpoint(req: Request, res: Response) {
        const endpointFound = this.endpoints.find(endpoint => endpoint.condition(req));

        let endpointToCall = this.noEndpointHandler;

        if (endpointFound !== undefined) {
            endpointToCall = endpointFound.handler;
        }

        if (endpointToCall !== undefined) {
            endpointToCall(req, res);
        }
    }

    private callListeners(req: Request) {
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
