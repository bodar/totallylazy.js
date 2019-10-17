export function cache(target: any, name: string, descriptor: PropertyDescriptor) {
    if (typeof descriptor.value != 'function') throw new Error("@cache can only decorate methods");

    const cache: { [key: string]: any } = {};

    return Object.defineProperty(target, name, {
        ...descriptor,
        value: function (...args: any[]) {
            const key = JSON.stringify(args);
            // @ts-ignore
            const result = cache[key];
            if (typeof result !== 'undefined') return result;
            return cache[key] = descriptor.value.call(this, ...args);
        }
    });
}

export function caching<F extends Function>(fun: F): F {
    const cache: { [key: string]: any } = {};

    return function (...args: any[]) {
        const key = JSON.stringify(args);
        const result = cache[key];
        if (typeof result !== 'undefined') return result;
        return cache[key] = fun(...args);
    } as any;
}