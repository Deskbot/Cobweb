import { IncomingMessage, ServerResponse } from "http";

export interface RequestHandler<M extends MiddlewareInventory<string>> {
    (req: IncomingMessage, res: ServerResponse, middlewares: M): void
}

export interface RequestSideEffect<M extends MiddlewareInventory<string>> {
    (req: IncomingMessage, middlewares: M): void;
}

export interface RequestPredicate {
    (req: IncomingMessage): boolean | Promise<boolean>;
}

export interface Endpoint<M extends MiddlewareInventory<string>> {
    when: RequestPredicate;
    do: RequestHandler<M>;
}

export interface Observer<M extends MiddlewareInventory<string>> {
    when: RequestPredicate;
    do: RequestSideEffect<M>;
}

export interface Middleware<T> {
    (req: IncomingMessage): T;
}

export type MiddlewareInventory<S extends string> = Record<S, Middleware<any>>;
