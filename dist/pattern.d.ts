export declare function match<T, R>(instance: T, ...matchers: Matcher<T, R>[]): R;
export interface Matcher<T, R> {
    matches(instance: T): R | undefined;
}
export declare function case_<T, R>(pattern: Pattern<T>, handler: (instance: Matched<T>) => R): Matcher<T, R>;
export declare function default_<T, R>(handler: () => R): Matcher<any, R>;
export declare class CaseMatcher<T, R> implements Matcher<T, R> {
    private pattern;
    private handler;
    constructor(pattern: Pattern<T>, handler: (instance: Matched<T>) => R);
    matches(instance: T): R | undefined;
}
export declare type Pattern<T> = {
    [P in keyof T]?: T[P] | Matcher<T[P], any[] | {
        [key: string]: any;
    }>;
};
export declare type Matched<T> = {
    [P in keyof T]?: T[P] | any[] | {
        [key: string]: any;
    };
};
export declare function regex(value: RegExp): RegexMatcher;
export declare class RegexMatcher implements Matcher<any, string[]> {
    private value;
    constructor(value: RegExp);
    matches(instance: any): string[] | undefined;
}
export declare function isPartial<T>(instance: T, partial: Partial<T>): boolean;
export declare function apply<T>(instance: T, pattern: Pattern<T>): Matched<T> | undefined;
