import { IncomingMessage, ServerResponse } from "http";

export interface RequestHandler<I extends Middleware> {
    (req: IncomingMessage, res: ServerResponse, middlewares: I): void
}

export interface RequestSideEffect<I extends Middleware> {
    (req: IncomingMessage, middlewares: I): void;
}

export interface RequestPredicate {
    (req: IncomingMessage): boolean | Promise<boolean>;
}

export interface Endpoint<I extends Middleware> {
    when: RequestPredicate;
    do: RequestHandler<I>;
}

export interface Observer<I extends Middleware> {
    when: RequestPredicate;
    do: RequestSideEffect<I>;
}

export type MiddlewareSpec = Record<string | number | symbol, (req: IncomingMessage) => any>;

export type Middleware<M extends MiddlewareSpec = MiddlewareSpec> = {
    [N in keyof M]: () => ReturnType<M[N]>
};

export interface MiddlewareConstructor<I extends Middleware> {
    new(req: IncomingMessage): I;
    prototype?: Partial<I>;
}
