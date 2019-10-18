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
