/// <reference types="node" />
import { Endpoint, Observer, Middleware, RequestHandler, MiddlewareSpec } from "./types";
import { IncomingMessage, ServerResponse } from "http";
export declare class Quelaag<S extends MiddlewareSpec, M extends Middleware<S> = Middleware<S>> {
    private endpoints;
    private MiddlewareInventory;
    private observers;
    private noEndpointHandler;
    constructor(middlewareSpec: S);
    addEndpoint(handler: Endpoint<M>): void;
    addObserver(handler: Observer<M>): void;
    private callEndpoints;
    private callObservers;
    handle(req: IncomingMessage, res: ServerResponse): void;
    setFallbackEndpoint(handler: RequestHandler<M> | undefined): void;
}
