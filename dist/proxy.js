"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.on = exports.call = void 0;
let invocation;
function call(value) {
    return invocation;
}
exports.call = call;
function on(instance) {
    invocation = [];
    const proxy = new Proxy(instance, {
        get(target, name, receiver) {
            invocation.push(name);
            return proxy;
        },
        set(target, name, value, receiver) {
            invocation.push(name, value);
            return proxy;
        },
        apply(target, thisArg, args) {
            invocation.push(args);
            return proxy;
        }
    });
    return proxy;
}
exports.on = on;
//# sourceMappingURL=proxy.js.map