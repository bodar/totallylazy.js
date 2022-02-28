import { Month, MonthFormat, Options, Weekday, WeekdayFormat } from "./core";
import { Datum, DatumLookup } from "../parsing";
import DateTimeFormatPartTypes = Intl.DateTimeFormatPartTypes;
import DateTimeFormatPart = Intl.DateTimeFormatPart;
export declare type MonthDatum = Datum<Month>;
export declare class Months extends DatumLookup<Month> {
    private readonly numerals;
    constructor(data: Datum<Month>[], locale: string);
    parse(value: string): Month;
    static formats: Options[];
    static cache: {
        [key: string]: Months;
    };
    static get(locale: string, additionalData?: MonthDatum[]): Months;
    static set(locale: string, months: Months): Months;
    static create(locale: string, additionalData?: MonthDatum[]): Months;
    static generateData(locale: string): MonthDatum[];
    static dataFor(locale: string, options: Options, native?: boolean): MonthDatum[];
}
export declare function months(locale: string, monthFormat?: MonthFormat | Options, native?: boolean): string[];
export declare type WeekdayDatum = Datum<Weekday>;
export declare class Weekdays extends DatumLookup<Weekday> {
    static formats: Options[];
    parse(value: string): Weekday;
    static cache: {
        [key: string]: Weekdays;
    };
    static get(locale: string, additionalData?: WeekdayDatum[]): Weekdays;
    static set(locale: string, weekdays: Weekdays): Weekdays;
    static create(locale: string, additionalData?: WeekdayDatum[]): Weekdays;
    static generateData(locale: string): WeekdayDatum[];
    static dataFor(locale: string, options: Options, native?: boolean): WeekdayDatum[];
}
export declare function weekdays(locale: string, weekdayFormat?: WeekdayFormat | Options, native?: boolean): string[];
export declare function exactFormat(locale: string, options: Options, dates: Date[]): string[];
export interface DataExtractor {
    extract(): string[];
}
export declare class BaseDataExtractor {
    protected locale: string;
    protected options: Options;
    protected dates: Date[];
    protected partType: DateTimeFormatPartTypes;
    constructor(locale: string, options: Options, dates: Date[], partType: DateTimeFormatPartTypes);
}
export declare function valueFromParts(parts: DateTimeFormatPart[], partType: Intl.DateTimeFormatPartTypes): string;
export declare class NativeDataExtractor extends BaseDataExtractor implements DataExtractor {
    extract(): string[];
}
export declare abstract class FromFormatStringDataExtractor extends BaseDataExtractor implements DataExtractor {
    extract(): string[];
    diff(data: string[]): string[];
}
export declare class FromFormatStringMonthExtractor extends FromFormatStringDataExtractor {
    constructor(locale: string, options: Options, dates: Date[]);
    diff(data: string[]): string[];
    private weekday;
    static readonly replaceYMD: RegExp;
    private replaceYearMonthDay;
    static readonly restoreYMD: RegExp;
    private restoreYearMonthDay;
    private day;
}
export declare class FromFormatStringWeekdayExtractor extends FromFormatStringDataExtractor {
    constructor(locale: string, options: Options, dates: Date[]);
    diff(data: string[]): string[];
    private convertToNumeral;
}
