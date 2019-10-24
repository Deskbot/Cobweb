import { IncomingMessage, ServerResponse } from "http";

export interface RequestHandler<I extends MiddlewareInventory<string>> {
    (req: IncomingMessage, res: ServerResponse, middlewares: I): void
}

export interface RequestSideEffect<I extends MiddlewareInventory<string>> {
    (req: IncomingMessage, middlewares: I): void;
}

export interface RequestPredicate {
    (req: IncomingMessage): boolean | Promise<boolean>;
}

export interface Endpoint<I extends MiddlewareInventory<string>> {
    when: RequestPredicate;
    do: RequestHandler<I>;
}

export interface Observer<I extends MiddlewareInventory<string>> {
    when: RequestPredicate;
    do: RequestSideEffect<I>;
}

export interface Middleware<T> {
    (req: IncomingMessage): T;
}

export type MiddlewareInventory<S extends string> = Record<S, Middleware<any>>;
export type MiddlewareSpecification<S extends string> = Record<S, Middleware<any>>;
