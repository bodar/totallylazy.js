export function flatten<T>(values: T[][]): T[] {
    return values.flatMap(v => v);
}

function isNativeFunction(instance: any): boolean {
    return typeof instance === 'function' && instance.toString().includes('native code');
}

const setSupported = isNativeFunction(Set) && new Set([1]).size === 1;

export function unique<T>(a: T[]): T[] {
    if (isNativeFunction(Array.from) && setSupported) return Array.from(new Set(a));

    const result = [];
    for (const item of a) {
        if (result.indexOf(item) < 0) {
            result.push(item);
        }
    }
    return result;
}