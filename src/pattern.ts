export function match<T, R>(instance: T, ...matchers: Matcher<T, R>[]): R {
    for (let i = 0; i < matchers.length; i++) {
        const matcher = matchers[i];
        const result = matcher.matches(instance);
        if (typeof result != 'undefined') return result;
    }
    throw new Error("Non exhaustive matches detected");
}

export interface Matcher<T, R> {
    matches(instance: T): R | undefined
}

export function case_<T, R>(pattern: Pattern<T>, handler: (instance: Matched<T>) => R): Matcher<T, R> {
    return new CaseMatcher(pattern, handler)
}

export function default_<T, R>(handler: () => R): Matcher<any, R> {
    return case_({}, handler);
}

export class CaseMatcher<T, R> implements Matcher<T, R> {
    constructor(private pattern: Pattern<T>, private handler: (instance: Matched<T>) => R) {
    }

    matches(instance: T): R | undefined {
        let result = apply(instance, this.pattern);
        if (typeof result == 'undefined') return undefined;
        return this.handler(result);
    }
}

export type Pattern<T> = { [P in keyof T]?: T[P] | Matcher<T[P], any[] | { [key: string]: any }>; }
export type Matched<T> = { [P in keyof T]?: T[P] | any[] | { [key: string]: any }; }

export function regex(value: RegExp): RegexMatcher {
    return new RegexMatcher(value)
}

export class RegexMatcher implements Matcher<any, string[]> {
    constructor(private value: RegExp) {
    }

    matches(instance: any): string[] | undefined {
        const match = this.value.exec(instance.toString());
        return match ? match.slice(1) : undefined;
    }
}

export function isPartial<T>(instance: T, partial: Partial<T>): boolean {
    return Object.keys(partial).every(function (k) {
        let key = k as keyof T;
        let actual: any = instance[key];
        let expected: any = partial[key];

        if (actual instanceof Object && expected instanceof Object) {
            return isPartial(actual, expected);
        }
        return partial[key] === actual;
    });
}

function value<T>(instance: T, key:keyof T) {
    const value = instance[key];
    if(typeof value === 'undefined'){
        const lower = key.toString().toLowerCase();
        const keys = Object.keys(instance);
        for (const k of keys) {
            if(lower === k.toLowerCase()) return (instance as any)[k];
        }
    }
    return value;
}

export function apply<T>(instance: T, pattern: Pattern<T>): Matched<T> | undefined {
    let clone: Matched<T> = Object.assign({}, instance);
    const keys = Object.keys(pattern);
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i] as keyof T;
        let actual = value(instance, key);
        let expected: any = pattern[key];

        if(typeof expected == 'undefined') continue;

        if (expected instanceof Object && 'matches' in expected) {
            let result = expected.matches(actual);
            if (typeof result == 'undefined') return undefined;
            clone[key] = result;
        } else if (actual instanceof Object && expected instanceof Object) {
            let result = apply(actual, expected);
            if (typeof result == 'undefined') return undefined;
            clone[key] = result;
        } else if (expected !== actual) return undefined;
    }

    return clone;
}