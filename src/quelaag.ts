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
    /** optional */
    Req = IncomingMessage,
    /** optional */
    Context = undefined,
    /** inferred */
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

    return (req, context) => {
        const middleware = new (constructor as any)(req, context)
        return destructurable(middleware, middlewareSpec)
    }
}

function destructurable<T>(middleware: T, spec: any): T {
    const destructurableMiddleware = {} as any

    for (const key in spec) {
        destructurableMiddleware[key] = () => (middleware as any)[key]()
    }

    return destructurableMiddleware;
}

/**
 * A function that makes a new Quelaag.
 * It is identical to `quelaag` except it takes a parent instance of Quelaag as a type argument,
 * which become the Context type of the new quelaag.
 *
 * Usage: subquelaag<typeof parentQuelaag>()({ middlewareSpecFuncs(req, parentMiddleware) {} })
 *
 * For technical reasons, there are two function calls here.
 * You call subquelaag with a type arg and no value args,
 * then you call the returned function with no type args and the middleware spec as a value arg.
 */
export function subquelaag<
    /** required type argument */
    Parent extends Quelaag<any, any>,

    /** derived */
    Req extends QuelaagReq<Parent>
              = QuelaagReq<Parent>,
    /** derived */
    ChildContext extends ReturnType<Parent>
                       = ReturnType<Parent>,
>() {
    return function
        <ChildSpec extends MiddlewareSpec<Req, ChildContext>>
        (childSpec: ChildSpec): Quelaag<Req, ChildContext, ChildSpec>
    {
        return quelaag(childSpec);
    }
}

/**
 * A function that makes a new Quelaag.
 * Identical to `subquelaag` except instead of taking a single parent type,
 * it takes a record of parent Quelaag types.
 * The Context type for the new Quelaag is this Record type.
 *
 * Usage: subquelaag<{
 *   parent1: typeof parentQuelaag1,
 *   parent2: typeof parentQuelaag2,
 * }>()({ middlewareSpecFuncs(req, { parent1, parent2 }) {} })
 *
 * For technical reasons, there are two function calls here.
 * You call subquelaag with a type arg and no value args,
 * then you call the returned function with no type args and the middleware spec as a value arg.
 */
export function multiParentSubquelaag<
    /** required type argument */
    Parents extends Record<keyof any, Quelaag<any, any>>,

    /** derived */
    Req extends QuelaagReq<ValuesOf<Parents>>
              = QuelaagReq<ValuesOf<Parents>>,
    /** derived */
    ChildContext extends { [K in keyof Parents]: ReturnType<Parents[K]> }
                       = { [K in keyof Parents]: ReturnType<Parents[K]> },
>() {
    return function
        <ChildSpec extends MiddlewareSpec<Req, ChildContext>>
        (childSpec: ChildSpec): Quelaag<Req, ChildContext, ChildSpec>
    {
        return quelaag(childSpec);
    }
}
