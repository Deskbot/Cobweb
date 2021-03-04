import { Middleware, MiddlewareSpec, Quelaag } from "./types";
import { IncomingMessage } from "http";

const __req = Symbol('request key');

export function quelaag<
    Req = IncomingMessage,
    Spec extends MiddlewareSpec<any, Req> = any,
    M extends Middleware<Req, Spec> = any
>
    (middlewareSpec: Spec): Quelaag<M, Req>
{
    const middlewareInventoryProto = {} as any;

    for (const name in middlewareSpec) {
        middlewareInventoryProto[name] = function () {
            const result = middlewareSpec[name].call(this, this[__req]);

            // overwrite this function for any future uses
            this[name] = () => result;
            return result;
        }
    }

    function constructor(this: any, req: Req) {
        this[__req] = req;
    };

    constructor.prototype = middlewareInventoryProto;

    return req => new constructor(req);
}

export default quelaag;
