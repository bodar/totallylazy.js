export function replace<T extends {}, K extends keyof T>(object: T, key: K, value: T[K]): T {
    return Object.defineProperty(object, key, {value});
}

export function lazy<T extends {}, K extends keyof T>(object: T, key: K, value: T[K]): T[K] {
    return replace(object, key, value)[key];
}

export function container<C>(activators: Activators<C>): C {
    return Object.keys(activators).reduce((container, activator) =>
        Object.defineProperty(container, activator, {
            configurable: true,
            get: () => lazy(container, activator as keyof C, (activators as any)[activator](container))
        }), <C>{});
}

export type Activator<C, T> = (c: C) => T;
export type Activators<C> = { [P in keyof C]: Activator<C, C[P]> }