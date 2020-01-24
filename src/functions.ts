export function identity<T>(): (instance: T) => T {
    return (instance: T) => instance;
}


export function get<R>(fun: () => R, defaultResult: any = undefined): R {
    try {
        const result = fun();
        if (typeof result == 'undefined') return defaultResult;
        return result;
    } catch (e) {
        return defaultResult;
    }
}
