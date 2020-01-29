import { IncomingMessage, ServerResponse } from "http";

export interface RequestHandler<M extends Middleware, I = IncomingMessage, R = ServerResponse> {
    (req: I, res: R, middleware: M): void
}

export interface RequestSideEffect<M extends Middleware, I = IncomingMessage> {
    (req: I, middlewares: M): void;
}

export interface RequestPredicate<I = IncomingMessage> {
    (req: I): boolean | Promise<boolean>;
}

export interface Endpoint<M extends Middleware, I = IncomingMessage, R = ServerResponse> {
    when: RequestPredicate<I>;
    do: RequestHandler<M, I, R>;
}

export interface Spy<M extends Middleware, I = IncomingMessage> {
    when: RequestPredicate<I>;
    do: RequestSideEffect<M, I>;
}

export type MiddlewareSpec<
    K extends string | number | symbol = any,
    I = IncomingMessage,
>
    = Record<K, (req?: I) => any>;

export type Middleware<S extends MiddlewareSpec<string | number | symbol, I> = any, I = IncomingMessage> = {
    [N in keyof S]: () => ReturnType<S[N]>
};

export interface MiddlewareConstructor<M extends Middleware<any, I>, I = IncomingMessage> {
    new(req: I): M;
    prototype?: Partial<M>;
}
