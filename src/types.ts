import { IncomingMessage, ServerResponse } from "http";

export interface RequestHandler<I extends MiddlewareInventory> {
    (req: IncomingMessage, res: ServerResponse, middlewares: I): void
}

export interface RequestSideEffect<I extends MiddlewareInventory> {
    (req: IncomingMessage, middlewares: I): void;
}

export interface RequestPredicate {
    (req: IncomingMessage): boolean | Promise<boolean>;
}

export interface Endpoint<I extends MiddlewareInventory> {
    when: RequestPredicate;
    do: RequestHandler<I>;
}

export interface Observer<I extends MiddlewareInventory> {
    when: RequestPredicate;
    do: RequestSideEffect<I>;
}

export interface MiddlewareSpec<T> {
    (req: IncomingMessage): T;
}

export interface Middleware<T> {
    (): T;
}

export type MiddlewareSpecification<S extends string> = Record<S, MiddlewareSpec<any>>;

export type MiddlewareInventory<M = MiddlewareSpecification<string>> = {
    [N in keyof M]: M[N] extends MiddlewareSpec<infer T> ? () => T : never
};
