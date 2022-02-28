import { Format, Months, Options, Weekdays } from "./index";
import { NamedRegExp } from "../characters";
import DateTimeFormatPart = Intl.DateTimeFormatPart;
import DateTimeFormat = Intl.DateTimeFormat;
export declare class Formatters {
    static create(locale: string, options?: string | Options): DateTimeFormat;
    static isNativelySupported(locale: string, options?: Options): boolean;
    static dateTimeFormat(locale: string, options: Options): DateTimeFormat;
}
export declare class ImprovedDateTimeFormat implements DateTimeFormat {
    private locale;
    private options;
    private delegate;
    constructor(locale: string, options: Options, delegate?: DateTimeFormat);
    private static create;
    format(date?: Date | number): string;
    formatToParts(date?: Date | number): Intl.DateTimeFormatPart[];
    resolvedOptions(): Intl.ResolvedDateTimeFormatOptions;
}
export declare function format(value: Date, locale: string, options?: Format | Options): string;
export declare class SimpleFormat implements DateTimeFormat {
    private locale;
    private value;
    private partsInOrder;
    private options;
    constructor(locale: string, value: string);
    format(date?: Date | number): string;
    formatToParts(raw?: Date | number): Intl.DateTimeFormatPart[];
    private valueFor;
    resolvedOptions(): Intl.ResolvedDateTimeFormatOptions;
}
export declare const hasNativeToParts: boolean;
export declare function formatData(value: Date, locale: string, options?: Options, native?: boolean): DateTimeFormatPart[];
export declare class DateParts {
    private locale;
    private options;
    private yearValue;
    private monthValue;
    private dayValue;
    private weekdayValue;
    private numerals;
    private constructor();
    static create(locale: string, options?: Options): DateParts;
    get formatter(): DateTimeFormat;
    get formatted(): string;
    get months(): Months;
    get month(): string;
    get weekdays(): Weekdays;
    get weekday(): string;
    get year(): string;
    get day(): string;
    get learningNamesPattern(): NamedRegExp;
    get actualNamesPattern(): NamedRegExp;
    toParts(date: Date): DateTimeFormatPart[];
    private collapseLiterals;
    private getType;
    private parsable;
}
