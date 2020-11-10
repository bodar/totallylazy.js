export function cache(target: any, name: string, descriptor: PropertyDescriptor) {
    if (typeof descriptor.value != 'function') throw new Error("@cache can only decorate methods");

    const cacheMap = new WeakMap<object, Map<string, any>>();

    function getCache(key: object) {
        const cache = cacheMap.get(key);
        if (cache) return cache;
        const map = new Map();
        cacheMap.set(key, map);
        return map;
    }

    return Object.defineProperty(target, name, {
        ...descriptor,
        value: function (...args: any[]) {
            const key = JSON.stringify(args);

            const cache = getCache(this);
            const result = cache.get(key);
            if (typeof result !== 'undefined') return result;
            if (cache.has(key)) return result;
            const value = descriptor.value.call(this, ...args);
            cache.set(key, value);
            return value;
        }
    });
}

export function caching<F extends Function>(fun: F): F {
    const cache = new Map<string, any>();

    return function (...args: any[]) {
        const key = JSON.stringify(args);

        const result = cache.get(key);
        if (typeof result !== 'undefined') return result;
        if (cache.has(key)) return result;
        const value = fun(...args);
        cache.set(key, value);
        return value;
    } as any;
}