"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.container = exports.lazy = exports.replace = void 0;
function replace(object, key, value) {
    return Object.defineProperty(object, key, { value });
}
exports.replace = replace;
function lazy(target, name, descriptor) {
    if (typeof descriptor.get == 'undefined')
        throw new Error("@lazy can only decorate getter methods");
    return Object.defineProperty(target, name, Object.assign(Object.assign({}, descriptor), { get() {
            // @ts-ignore
            return replace(this, name, descriptor.get.call(this))[name];
        } }));
}
exports.lazy = lazy;
function container(activators) {
    return Object.keys(activators).reduce((container, activator) => lazy(container, activator, {
        configurable: true,
        get: () => activators[activator](container)
    }), {});
}
exports.container = container;
//# sourceMappingURL=lazy.js.map