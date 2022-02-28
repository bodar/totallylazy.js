export declare type Names = string[];
export interface NamedMatch {
    name: string;
    value: string;
}
export declare type NonMatch = string;
export declare type MatchOrNot = NamedMatch[] | NonMatch;
export declare class NamedRegExp {
    pattern: RegExp;
    names: Names;
    constructor(pattern: RegExp, names: Names);
    static create(originalPattern: string, flags?: string): NamedRegExp;
    match(value: string): NamedMatch[];
    private namedMatch;
    exec(value: string): Iterable<NamedMatch[]>;
    iterate(value: string): Iterable<MatchOrNot>;
    toString(): string;
    toJSON(): {
        pattern: string;
        names: Names;
    };
}
export declare function isNamedMatch(value: MatchOrNot): value is NamedMatch[];
export declare function isNonMatch(value: MatchOrNot): value is NonMatch;
export declare function replace(regex: RegExp, value: string, replacer: (match: RegExpExecArray) => string, nonMatchedReplacer?: (a: string) => string): string;
export declare function prefix(charactersA: string[], charactersB: string[]): number;
export declare function suffix(charactersA: string[], charactersB: string[]): number;
export declare function different(values: string[]): string[];
export declare function removeUnicodeMarkers(value: string): string;
export declare function characters(value: string): string[];
export declare function splitByRegex(value: string): string[];
