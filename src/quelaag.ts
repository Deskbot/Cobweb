import { MiddlewareSpec, Quelaag, QuelaagReq, ValuesOf } from "./types";
import { IncomingMessage } from "http";

const __req = Symbol("request key");
const __context = Symbol("context key");

/**
 * @param middlewareSpec An object of middleware function definitions.
 *                       These functions take a request and optionally a context
 *                       and return anything you like.
 * @returns A function that takes a request parameter and a context parameter;
 *          it returns memoised versions of the given functions
 *          with that request and context already applied.
 */
export function quelaag<
    Req = IncomingMessage,
    Context = undefined,
    Spec extends MiddlewareSpec<Req, Context> = MiddlewareSpec<Req, Context>,
>
    (middlewareSpec: Spec): Quelaag<Req, Context, Spec>
{
    const middlewareProto = {} as any;

    // Build a Middleware prototype.

    for (const name in middlewareSpec) {
        middlewareProto[name] = function() {
            const result = middlewareSpec[name].call(this, this[__req], this[__context]);

            // This function exists on the object prototype.
            // Create a new function on the instance.
            // If the same method is called again,
            // the instance function takes precedence, returning the memoised result.
            // The lifetime of the memoised values in memory is tied to the lifetime of the middleware instance.
            this[name] = () => result;

            return result;
        }
    }

    // Define the constructor for objects with the middleware prototype.

    function constructor(this: any, req: Req, context: Context) {
        this[__req] = req;
        this[__context] = context;
    };

    constructor.prototype = middlewareProto;

    return (req, context) => new (constructor as any)(req, context);
}

/**
 * A function that makes a new Quelaag.
 * It is identical to quelaag(...) except it takes a parent instance of Quelaag as the first parameter
 * to become the Context type of the new quelaag.
 * The actual value of the parent is unused.
 * The purpose of passing a value instead of a type argument is to make use of TypeScript's inference.
 */
export function subquelaag<
    Parent extends Quelaag<any, any, any>,
    ChildSpec extends MiddlewareSpec<Req, ChildContext>,
    Req extends QuelaagReq<Parent> = QuelaagReq<Parent>,
    ChildContext extends ReturnType<Parent> = ReturnType<Parent>,
>
    (parent: Parent, childSpec: ChildSpec): Quelaag<Req, ChildContext, ChildSpec>
{
    return quelaag(childSpec);
}

/**
 * A function that makes a new Quelaag.
 * Identical to subquelaag(...) except instead of taking a single parent it takes a record of parent Quelaags.
 * The Context type for the new Quelaag is the Record type given to the first parameter.
 */
export function multiParentSubquelaag<
    Parents extends Record<keyof any, Quelaag<any, any, any>>,
    ChildSpec extends MiddlewareSpec<Req, ChildContext>,
    Req extends QuelaagReq<ValuesOf<Parents>>,
    ChildContext = {
        [K in keyof Parents]: ReturnType<Parents[K]>
    },
>
    (parents: Parents, childSpec: ChildSpec): Quelaag<Req, ChildContext, ChildSpec>
{
    return quelaag(childSpec);
}
