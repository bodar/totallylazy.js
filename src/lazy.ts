export function replace<T extends {}, K extends keyof T>(object: T, key: K, value: T[K]): T {
    return Object.defineProperty(object, key, {value});
}

export function lazy(target: any, name: string, descriptor: PropertyDescriptor) {
    if (typeof descriptor.get == 'undefined') throw new Error("@lazy can only decorate getter methods");
    return Object.defineProperty(target, name, {
        ...descriptor,
        get(): any {
            // @ts-ignore
            return replace(this, name, descriptor.get.call(this))[name]
        }
    });
}

export function cache(target: any, name: string, descriptor: PropertyDescriptor) {
    if (typeof descriptor.value != 'function') throw new Error("@cache can only decorate methods");

    const cache: { [key: string]: any } = {};

    return Object.defineProperty(target, name, {
        ...descriptor,
        value: function(...args:any[]) {
            const key = JSON.stringify(args);
            // @ts-ignore
            return cache[key] = cache[key] || descriptor.value.call(this, ...args);
        }
    });
}

export function container<C>(activators: Activators<C>): C {
    return Object.keys(activators).reduce((container, activator) =>
        lazy(container, activator, {
            configurable: true,
            get: () => (activators as any)[activator](container)
        }), <C>{});
}

export type Activator<C, T> = (c: C) => T;
export type Activators<C> = { [P in keyof C]: Activator<C, C[P]> }