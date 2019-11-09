"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Quelaag {
    constructor(middlewareSpec) {
        this.endpoints = [];
        this.observers = [];
        this.MiddlewareInventory = middlewareSpecToConstructor(middlewareSpec);
    }
    addEndpoint(handler) {
        this.endpoints.push(handler);
    }
    addObserver(handler) {
        this.observers.push(handler);
    }
    callEndpoints(req, res, middleware) {
        const endpointFound = this.endpoints.find(endpoint => endpoint.when(req));
        let endpointToCall = this.noEndpointHandler;
        if (endpointFound !== undefined) {
            endpointToCall = endpointFound.do;
        }
        if (endpointToCall !== undefined) {
            endpointToCall(req, res, middleware);
        }
    }
    callObservers(req, middleware) {
        for (const observer of this.observers) {
            const condition = observer.when(req);
            if (condition instanceof Promise) {
                condition.then(() => {
                    observer.do(req, middleware);
                });
            }
            else {
                observer.do(req, middleware);
            }
        }
    }
    handle(req, res) {
        const middlewareInventory = new this.MiddlewareInventory(req);
        this.callObservers(req, middlewareInventory);
        this.callEndpoints(req, res, middlewareInventory);
    }
    setFallbackEndpoint(handler) {
        this.noEndpointHandler = handler;
    }
}
exports.Quelaag = Quelaag;
function middlewareSpecToConstructor(middlewareSpec) {
    const middlewareInventoryProto = {};
    for (const name in middlewareSpec) {
        middlewareInventoryProto[name] = function () {
            const result = middlewareSpec[name](this.__req);
            // overwrite this function for any future uses
            this[name] = () => result;
            return result;
        };
    }
    function constructor(req) {
        this.__req = req;
    }
    ;
    constructor.prototype = middlewareInventoryProto;
    return constructor;
}
//# sourceMappingURL=Quelaag.js.map