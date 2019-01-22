export function flatten<T>(values: T[][]): T[] {
    return values.reduce((a, ms) => a.concat(ms), []);
}

export function unique<T>(a: T[]): T[] {
    if (typeof Array.from === 'function' && typeof Set === 'function') return Array.from(new Set(a));

    const result = [];
    for (const item of a) {
        if (result.indexOf(item) < 0) {
            result.push(item);
        }
    }
    return result;
}