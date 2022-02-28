import { NamedMatch, NamedRegExp } from "./characters";
import { PrefixTree } from "./trie";
import { Comparator, Mapper } from "./collections";
export declare class NamedRegexParser implements Parser<NamedMatch[]> {
    protected regex: NamedRegExp;
    constructor(regex: NamedRegExp);
    parse(value: string): NamedMatch[];
    parseAll(value: string): NamedMatch[][];
}
export declare function namedRegexParser(regex: NamedRegExp): NamedRegexParser;
export declare class PreProcessor<T> implements Parser<T> {
    private delegate;
    private mapper;
    constructor(delegate: Parser<T>, mapper: Mapper<string, string>);
    parse(value: string): T;
    parseAll(value: string): T[];
}
export declare function preProcess<T>(delegate: Parser<T>, mapper: Mapper<string, string>): PreProcessor<T>;
export declare class MappingParser<A, B> implements Parser<B> {
    private parser;
    private mapper;
    constructor(parser: Parser<A>, mapper: Mapper<A, B>);
    parse(value: string): B;
    parseAll(value: string): B[];
}
export declare function mappingParser<A, B>(parser: Parser<A>, mapper: Mapper<A, B>): MappingParser<A, B>;
export interface Parser<T> {
    parse(value: string): T;
    parseAll(value: string): T[];
}
export declare class IdentityParser implements Parser<string> {
    parse(value: string): string;
    parseAll(value: string): string[];
}
export declare class FailParser implements Parser<any> {
    parse(value: string): any;
    parseAll(value: string): any[];
}
export interface Datum<V> {
    name: string;
    value: V;
}
export declare class DatumLookup<V> {
    private readonly data;
    private readonly prefixTree;
    constructor(data: Datum<V>[], comparator?: Comparator<string>);
    parse(value: string, strategy?: MatchStrategy<V>): V;
    get pattern(): string;
    get max(): number;
    get characters(): string[];
}
export declare type MatchStrategy<V> = (prefixTree: PrefixTree<Datum<V>[]>, value: string) => V | undefined;
export declare function uniqueMatch<V>(prefixTree: PrefixTree<Datum<V>[]>, value: string): V | undefined;
export declare function prefer<V>(value: undefined): undefined;
export declare function prefer<V>(...values: V[]): MatchStrategy<V>;
export declare function infer(locale: string): MatchStrategy<string>;
export declare class OrParser<T> implements Parser<T> {
    private readonly parsers;
    constructor(parsers: Parser<T>[]);
    parse(value: string): T;
    parseAll(value: string): T[];
}
export declare function or<T>(...parsers: Parser<T>[]): Parser<T>;
export declare function parsers<T>(...parsers: Parser<T>[]): Parser<T>;
export declare class AllParser<T> implements Parser<T> {
    private readonly parsers;
    constructor(parsers: Parser<T>[]);
    parse(value: string): T;
    parseAll(value: string): T[];
}
export declare function all<T>(...parsers: Parser<T>[]): Parser<T>;
export declare class CachingParser<T> implements Parser<T> {
    private parser;
    constructor(parser: Parser<T>);
    parse(value: string): T;
    parseAll(value: string): T[];
}
export declare const boundaryDelimiters = ",.";
export declare const extraDelimiters = " -/";
export declare function cleanValue(value: string): string;
export declare function atBoundaryOnly(pattern: string): string;
export declare type Numeral = Datum<number>;
export declare class Numerals extends DatumLookup<number> {
    private locale;
    constructor(data: Datum<number>[], locale: string);
    static cache: {
        [key: string]: Numerals;
    };
    static get(locale: string, additionalData?: Numeral[]): Numerals;
    static create(locale: string, additionalData?: Numeral[]): Numerals;
    static generateData(locale: string): Numeral[];
    parse(value: string): number;
    format(value: number): string;
}
export declare const numberFormatter: (locale: string) => Intl.NumberFormat;
export declare const digits: (locale: string) => string;
export declare class Spaces {
    static codes: string[];
    static spaces: string;
    static pattern: RegExp;
    static handle(value: string): string;
}
export declare const numberPattern: (locale: string) => string;
export declare function mapIgnoreError<A, B>(mapper: Mapper<A, B>): import("./transducers").FlatMapTransducer<A, B>;
export declare function separatorsOf(amount: string): string[];
export declare type AllowedDecimalSeparators = '.' | ',' | '٫';
export declare function isDecimalSeparator(value: any): value is AllowedDecimalSeparators;
export declare function decimalSeparator(value: any): AllowedDecimalSeparators;
export declare class NumberParser implements Parser<number> {
    private decimalSeparator;
    private locale;
    readonly strictNumberPattern: RegExp;
    readonly globalNumberPattern: NamedRegExp;
    constructor(decimalSeparator: (amount: string) => AllowedDecimalSeparators, locale: string);
    parse(value: string): number;
    parseAll(value: string): number[];
    private parseSingle;
    private convert;
    private numberOf;
}
export declare type Locale = string;
export declare function numberParser(): Parser<number>;
export declare function numberParser(decimalSeparatorOrLocale: AllowedDecimalSeparators | Locale): Parser<number>;
export declare function numberParser(decimalSeparator: AllowedDecimalSeparators, locale: Locale): Parser<number>;
export declare const inferDecimalSeparator: (locale: string) => AllowedDecimalSeparators;
export declare function numberOf(value: string): number;
