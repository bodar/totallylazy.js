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

export function case_<T, R>(pattern: Pattern<T>, handler: (instance: PatternResult<T>) => R): Matcher<T, R> {
    return new CaseMatcher(pattern, handler)
}

export class CaseMatcher<T, R> implements Matcher<T, R> {
    constructor(private pattern: Pattern<T>, private handler: (instance: PatternResult<T>) => R) {
    }

    matches(instance: T): R | undefined {
        let result = apply(instance, this.pattern);
        if (typeof result == 'undefined') return undefined;
        return this.handler(result);
    }
}

export type Pattern<T> = { [P in keyof T]?: T[P] | Matcher<T[P], {} | any[]>; }
export type PatternResult<T> = { [P in keyof T]?: T[P] | any[] | { [key:string]:any }; }

export function regex(value: RegExp): RegexMatcher {
    return new RegexMatcher(value)
}

export class RegexMatcher implements Matcher<string, string[]> {
    constructor(private value: RegExp) {
    }

    matches(instance: string): string[] | undefined {
        const match = this.value.exec(instance);
        return match ? match.slice() : undefined;
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

export function apply<T>(instance: T, pattern: Pattern<T>): PatternResult<T> | undefined {
    let clone: PatternResult<T> = Object.assign({}, instance);
    const keys = Object.keys(pattern);
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i] as keyof T;
        let actual: any = instance[key];
        let expected: any = pattern[key];

        if (typeof actual == 'string' && expected instanceof Object && 'matches' in expected) {
            let result = expected.matches(actual);
            if (typeof result == undefined) return undefined;
            clone[key] = result;
        } else if (actual instanceof Object && expected instanceof Object) {
            let result = apply(actual, expected);
            if (typeof result == undefined) return undefined;
            clone[key] = result;
        } else if (pattern[key] !== actual) return undefined;
    }

    return clone;
}