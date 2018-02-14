export interface Pattern<T, R> {
    matches(instance: T): R | undefined
}

export class SimplePattern<T, R> implements Pattern<T, R> {
    constructor(private filter: Partial<T>, private handler: (instance: Partial<T>) => R) {}

    matches(instance: T): R | undefined {
        if(subset(instance, this.filter)) {
            return this.handler(instance);
        }
        return undefined;
    }

}

export function pattern<T, R>(filter: Partial<T>, handler: (instance: Partial<T>) => R): Pattern<T, R> {
    return new SimplePattern(filter, handler)
}

export function match<T, R>(instance: T, ...patterns: Pattern<T, R>[]): R {
    for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i];
        const result = pattern.matches(instance);
        if (typeof result != 'undefined') return result;
    }
    throw new Error("Non exhaustive matches detected");
}


export function subset(instance: any, filter: { [name: string]: any | RegExp; }): boolean {
    if (!filter) {
        return true;
    }

    return Object.keys(filter).every(function (key) {
        var expected = filter[key];
        let actual = instance[key];

        if (expected instanceof RegExp && typeof actual == 'string') {
            return expected.test(actual);
        }
        if (expected instanceof Object && actual instanceof Object) {
            return match(actual, expected);
        }
        return filter[key] === actual;
    });
}