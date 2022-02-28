"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.caching = exports.cache = void 0;
function cache(target, name, descriptor) {
    if (typeof descriptor.value != 'function')
        throw new Error("@cache can only decorate methods");
    const cacheMap = new WeakMap();
    function getCache(key) {
        const cache = cacheMap.get(key);
        if (cache)
            return cache;
        const map = new Map();
        cacheMap.set(key, map);
        return map;
    }
    return Object.defineProperty(target, name, Object.assign(Object.assign({}, descriptor), { value: function (...args) {
            const key = JSON.stringify(args);
            const cache = getCache(this);
            const result = cache.get(key);
            if (typeof result !== 'undefined')
                return result;
            if (cache.has(key))
                return result;
            const value = descriptor.value.call(this, ...args);
            cache.set(key, value);
            return value;
        } }));
}
exports.cache = cache;
function caching(fun) {
    const cache = new Map();
    return function (...args) {
        const key = JSON.stringify(args);
        const result = cache.get(key);
        if (typeof result !== 'undefined')
            return result;
        if (cache.has(key))
            return result;
        const value = fun(...args);
        cache.set(key, value);
        return value;
    };
}
exports.caching = caching;
//# sourceMappingURL=cache.js.map