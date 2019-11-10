import { IncomingMessage, ServerResponse } from "http";

export interface RequestHandler<M extends Middleware> {
    (req: IncomingMessage, res: ServerResponse, middleware: M): void
}

export interface RequestSideEffect<M extends Middleware> {
    (req: IncomingMessage, middlewares: M): void;
}

export interface RequestPredicate {
    (req: IncomingMessage): boolean | Promise<boolean>;
}

export interface Endpoint<M extends Middleware> {
    when: RequestPredicate;
    do: RequestHandler<M>;
}

export interface Spy<M extends Middleware> {
    when: RequestPredicate;
    do: RequestSideEffect<M>;
}

export type MiddlewareSpec<K extends string | number | symbol = string | number | symbol> = Record<K, (req?: IncomingMessage) => any>;

export type Middleware<M extends MiddlewareSpec<string | number | symbol> = MiddlewareSpec<string | number | symbol>> = {
    [N in keyof M]: () => ReturnType<M[N]>
};

export interface MiddlewareConstructor<M extends Middleware> {
    new(req: IncomingMessage): M;
    prototype?: Partial<M>;
}
