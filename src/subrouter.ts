import { ServerResponse } from "http";
import { subquelaag } from "./quelaag";
import { Router } from "./router";
import { Endpoint, Fallback, Middleware, MiddlewareSpec, Quelaag, RouterI, Spy } from "./types";

export class SubRouter1<
    ParentContext,
    ParentQ extends Quelaag = Quelaag,

    Req = (ParentQ extends Quelaag<Middleware<unknown, infer R>> ? R : never),
    Res = ServerResponse,

    ParentM extends ReturnType<ParentQ> = ReturnType<ParentQ>, // the context for the sub spec

    ChildSpec extends MiddlewareSpec<ParentM, Req>
                    = MiddlewareSpec<ParentM, Req>,
    SubQ extends Quelaag<Middleware<ParentM, Req, ChildSpec>>
               = Quelaag<Middleware<ParentM, Req, ChildSpec>>,

    M extends ReturnType<SubQ> = ReturnType<SubQ>,

> implements RouterI<ParentM, Req, Res, SubQ, M> {

    private router: RouterI<ParentM, Req, Res, SubQ, M>;

    constructor(parentRouter: RouterI<ParentContext, Req, Res, ParentQ, ParentM>, spec: ChildSpec) {
        this.router = new Router(subquelaag(parentRouter.quelaag, spec) as SubQ);
    }

    addEndpoint(handler: Endpoint<ParentM, Req, Res, M>): void {
        return this.router.addEndpoint(handler);
    }

    addSpy(handler: Spy<ParentM, Req, M>): void {
        return this.router.addSpy(handler);
    }

    handle(req: Req, res: Res, context: ParentM): void {
        return this.router.handle(req, res, context);
    }

    get quelaag() {
        return this.router.quelaag;
    }

    setFallbackEndpoint(handler: Fallback<ParentM, Req, Res, M> | undefined): void {
        return this.router.setFallbackEndpoint(handler);
    }
}

export function subRouter2<
    ParentContext,
    ParentQ extends Quelaag = Quelaag,

    Req = (ParentQ extends Quelaag<Middleware<unknown, infer R>> ? R : never),
    Res = ServerResponse,

    ParentM extends ReturnType<ParentQ> = ReturnType<ParentQ>, // the context for the sub spec

    ChildSpec extends MiddlewareSpec<ParentM, Req>
                    = MiddlewareSpec<ParentM, Req>,
    SubQ extends Quelaag<Middleware<ParentM, Req, ChildSpec>>
               = Quelaag<Middleware<ParentM, Req, ChildSpec>>,

    M extends ReturnType<SubQ> = ReturnType<SubQ>,

>(parentRouter: RouterI<ParentContext, Req, Res, ParentQ, ParentM>, spec: ChildSpec): RouterI<ParentM, Req, Res, SubQ, M> {
    return new Router(subquelaag(parentRouter.quelaag, spec) as SubQ);
}
