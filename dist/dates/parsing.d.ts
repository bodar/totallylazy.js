import { NamedMatch, NamedRegExp } from "../characters";
import { Format, Month, Options, Weekday } from "./index";
import { Parser } from "../parsing";
import { Clock } from "./clock";
import DateTimeFormatPart = Intl.DateTimeFormatPart;
import DateTimeFormatPartTypes = Intl.DateTimeFormatPartTypes;
export declare function parse(value: string, locale: string, options?: string | Options, native?: boolean): Date;
export declare class RegexBuilder {
    private locale;
    private options;
    private formatted;
    constructor(locale: string, options: Options, formatted: DateTimeFormatPart[]);
    static create(locale: string, options?: string | Options, native?: boolean): RegexBuilder;
    get pattern(): string;
    private lengthOf;
    private addExtraLiterals;
    private monthsPattern;
}
export declare function escapeCharacters(value: string): string;
export declare class DateParser {
    static create(locale: string, options?: string | Options, native?: boolean): import("../parsing").MappingParser<DateTimeFormatPart[], Date>;
}
export declare class DateTimeFormatPartParser {
    static create(regex: NamedRegExp, locale: string): Parser<DateTimeFormatPart[]>;
    static convert(matches: NamedMatch[], locale: string): DateTimeFormatPart[];
    static preProcess(value: string, locale: string): string;
}
export declare function dateFrom(parts: DateTimeFormatPart[], locale: string, factory?: DateFactory): Date;
export interface DateFactoryParts {
    day: number;
    month: Month;
    year?: number;
    weekday?: Weekday;
}
export interface DateFactory {
    create(parts: DateFactoryParts): Date;
}
export declare class DefaultDateFactory implements DateFactory {
    create({ year, month, day }: DateFactoryParts): Date;
}
export declare function compositeDateFactory(...factories: DateFactory[]): DateFactory;
export declare class InferYearViaWeekday implements DateFactory {
    private clock;
    private constructor();
    static create(clock?: Clock): DateFactory;
    create({ year, month, day, weekday }: DateFactoryParts): Date;
    private candidates;
}
export declare enum InferDirection {
    Before = -1,
    After = 1
}
export declare class InferYear implements DateFactory {
    private direction;
    private readonly date;
    private constructor();
    static before(date: Date): DateFactory;
    static after(date: Date): DateFactory;
    static sliding(clock?: Clock): DateFactory;
    create({ year, month, day }: DateFactoryParts): Date;
    private calculateYearIncrement;
    private calculateYear;
}
export declare class Pivot {
    /***
     * @deprecated Please use InferYear.before
     */
    static on(pivotYear: number): DateFactory;
    /***
     * @deprecated Please use InferYear.sliding
     */
    static sliding(clock?: Clock): DateFactory;
}
/***
 * @deprecated Please use InferYear
 */
export declare class SmartDate implements DateFactory {
    private clock;
    constructor(clock?: Clock);
    create(parts: DateFactoryParts): Date;
}
export declare class Days {
    static milliseconds: number;
    static startOf(value: Date): Date;
    static add(date: Date, days: number): Date;
    static subtract(date: Date, days: number): Date;
    static between(a: Date, b: Date): number;
}
export declare function formatFrom(type: DateTimeFormatPartTypes, length: number): string;
export declare const formatRegex: NamedRegExp;
export declare function partsFrom(format: Format): DateTimeFormatPart[];
export declare function optionsFrom(formatOrParts: Format | DateTimeFormatPart[]): Options;
export declare function formatBuilder(locale: string, format: Format, strict?: boolean): RegexBuilder;
export declare const defaultParserOptions: (Format | Options)[];
export declare function parser(locale: string, options?: Format | Options, native?: boolean): Parser<Date>;
export declare function simpleParser(locale: string, format: Format, native?: boolean): Parser<Date>;
export declare function localeParser(locale: string, options?: Format | Options, native?: boolean): Parser<Date>;
