export interface RequestHandler {
    (req: Request): void;
}

export interface RequestPredicate {
    (req: Request): boolean;
}

export interface ResponseHandler {
    (req: Request, res: Response): void;
}

export interface Endpoint {
    condition(req: Request): boolean;
    handler: ResponseHandler;
}

export interface Listener {
    condition(req: Request): boolean;
    handler: RequestHandler;
}

export class ServerBuilder {
    private endpoints: Endpoint[];
    private listeners: Listener[];
    private noEndpointHandler: ResponseHandler | undefined;

    constructor() {
        this.endpoints = [];
        this.listeners = [];
    }

    addEndpoint(handler: Endpoint): void;
    addEndpoint(condition: (req: Request) => boolean, handler: ResponseHandler): void;
    addEndpoint(conditionOrEndpoint: Endpoint | RequestPredicate, handler?: ResponseHandler) {
        if (handler !== undefined) {
            return this._addEndpointDestructured(conditionOrEndpoint as RequestPredicate, handler);
        }

        return this._addEndpoint(conditionOrEndpoint as Endpoint);
    }

    _addEndpoint(handler: Endpoint) {
        this.endpoints.push(handler);
    }

    _addEndpointDestructured(condition: (req: Request) => boolean, handler: ResponseHandler) {
        this.endpoints.push({
            condition,
            handler,
        });
    }

    addListener(handler: Listener) {
        this.listeners.push(handler);
    }

    build(): ResponseHandler {
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

            listeners.filter(listener => listener.condition(req))
                .forEach(listener => listener.handler(req));
        }
    }

    setNoEndpointHandler(handler: ResponseHandler) {
        this.noEndpointHandler = handler;
    }
}
