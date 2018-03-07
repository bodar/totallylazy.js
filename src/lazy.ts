export function replace<T extends {}, K extends keyof T>(object: T, key: K, value: T[K]): T {
    return Object.defineProperty(object, key, {value});
}

export function lazy<T extends {}, K extends keyof T>(object: T, key: K, value: T[K]): T[K] {
    return replace(object, key, value)[key];
}
