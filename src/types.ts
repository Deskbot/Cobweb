import { RequestListener, IncomingMessage } from "http";

export interface RequestSideEffect {
    (req: IncomingMessage): void;
}

export interface RequestPredicate {
    (req: IncomingMessage): boolean | Promise<boolean>;
}

export interface Endpoint {
    when: RequestPredicate;
    do: RequestListener;
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