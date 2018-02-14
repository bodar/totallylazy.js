export interface Matcher<T, R> {
    matches(instance: T): R | undefined
}

export class SubsetMatcher<T, R> implements Matcher<T, R> {
    constructor(private filter: Partial<T>, private handler: (instance: T) => R) {
    }

    matches(instance: T): R | undefined {
        if (subset(instance, this.filter)) {
            return this.handler(instance);
        }
        return undefined;
    }
}

export function case_<T, R>(partial: Partial<T>, handler: (instance: T) => R): Matcher<T, R> {
    return new SubsetMatcher(partial, handler)
}

export function match<T, R>(instance: T, ...patterns: Matcher<T, R>[]): R {
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
            return subset(actual, expected);
        }
        return filter[key] === actual;
    });
}