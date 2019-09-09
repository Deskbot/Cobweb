export interface RequestHandler {
    (req: Request): void | Promise<void>;
}

export interface RequestPredicate {
    (req: Request): boolean;
}

export interface ResponseHandler {
    (req: Request, res: Response): void;
}

export interface Endpoint {
    condition(req: Request): boolean | Promise<boolean>;
    handler: ResponseHandler;
}

export interface Listener {
    condition(req: Request): boolean | Promise<boolean>;
    handler: RequestHandler;
}
