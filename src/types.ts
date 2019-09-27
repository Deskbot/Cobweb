import { RequestListener, IncomingMessage } from "http";

export interface RequestOnlyListener {
    (req: IncomingMessage): void | Promise<void>;
}

export interface RequestPredicate {
    (req: IncomingMessage): boolean;
}

export interface Endpoint {
    condition(req: IncomingMessage): boolean | Promise<boolean>;
    handler: RequestListener;
}

export interface Listener {
    condition(req: IncomingMessage): boolean | Promise<boolean>;
    handler: RequestOnlyListener;
}
