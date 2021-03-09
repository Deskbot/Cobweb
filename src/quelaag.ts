import { Middleware, MiddlewareSpec, Quelaag } from "./types";
import { IncomingMessage } from "http";

const __req = Symbol("request key");
const __context = Symbol("context key");

export function quelaag<
    Context,
    Req = IncomingMessage,
    Spec extends MiddlewareSpec<any, Req> = any,
    M extends Middleware<Req, Spec> = any
>
    (middlewareSpec: Spec): Quelaag<Context, M, Req>
{
    const middlewareInventoryProto = {} as any;

    for (const name in middlewareSpec) {
        middlewareInventoryProto[name] = function () {
            const result = middlewareSpec[name].call(this, this[__req], this[__context]);

            // overwrite this function for any future uses
            this[name] = () => result;
            return result;
        }
    }

    function constructor(this: any, req: Req, context?: Context) {
        this[__req] = req;
        this[__context] = context;
    };

    constructor.prototype = middlewareInventoryProto;

    return (req, context?) => new constructor(req, context);
}

export default quelaag;
