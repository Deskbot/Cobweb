import { IncomingMessage, ServerResponse } from "http";

export interface RequestHandler {
    (req: IncomingMessage, res: ServerResponse, middlewares: MiddlewareInventory): void
}

export interface RequestSideEffect {
    (req: IncomingMessage, middlewares: MiddlewareInventory): void;
}

export interface RequestPredicate {
    (req: IncomingMessage): boolean | Promise<boolean>;
}

export interface Endpoint {
    when: RequestPredicate;
    do: RequestHandler;
}

export interface Observer {
    when: RequestPredicate;
    do: RequestSideEffect;
}

export interface Middleware<T> {
    (req: IncomingMessage): T;
}

export interface MiddlewareInventory {
    [name: string]: Middleware<any>;
}
