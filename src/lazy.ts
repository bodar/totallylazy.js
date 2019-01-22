export function replace<T extends {}, K extends keyof T>(object: T, key: K, value: T[K]): T {
    return Object.defineProperty(object, key, {value});
}

export function lazy(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (typeof descriptor.get == 'undefined') throw new Error("@lazy can only decorate getter methods");
    return Object.defineProperty(target, propertyKey, {
        ...descriptor,
        get(): any {
            // @ts-ignore
            return replace(this, propertyKey, descriptor.get.call(this))[propertyKey]
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