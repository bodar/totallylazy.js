export function flatten<T>(values: T[][]): T[] {
    return values.reduce((a, ms) => a.concat(ms), []);
}

const setSupported = typeof Set === 'function' && new Set([1]).size === 1;

export function unique<T>(a: T[]): T[] {
    if (typeof Array.from === 'function' && setSupported) return Array.from(new Set(a));

    const result = [];
    for (const item of a) {
        if (result.indexOf(item) < 0) {
            result.push(item);
        }
    }
    return result;
}