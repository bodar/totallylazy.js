declare global {
    interface String {
        toLocaleLowerCase(locale: string): string;

        toLocaleUpperCase(locale: string): string;
    }
}

export function date(year: number, month?: number, day?: number): Date {
    if (month && (month < 1 || month > 12)) throw new Error(`Invalid month ${month}`);
    if (day && (day < 1 || day > 31)) throw new Error(`Invalid day ${day}`);
    const date = new Date(Date.UTC(year, month ? month - 1 : 0, day ? day : 1));
    if (year !== yearOf(date)) throw new Error(`Invalid year ${year}`);
    if (month && month !== monthOf(date)) throw new Error(`Invalid month ${month}`);
    if (day && day !== dayOf(date)) throw new Error(`Invalid day ${day}`);
    return date;
}

export type MonthFormat = 'numeric' | '2-digit' | 'short' | 'long';
export type WeekdayFormat = 'short' | 'long';


/**
 * Format:
 *  Year
 *      yy: 2 digit (01)
 *      yyyy: numeric (normally 4 digit)
 *  Month
 *      M: numeric (1 or 10)
 *      MM: 2 digit (01)
 *      MMM: short (Jan)
 *      MMMM: long (January)
 *  Day
 *      d: numeric (1 or 10)
 *      dd: 2 digit (01)
 *  Weekday
 *      EEE: short (Mon)
 *      EEEE: long (Monday)
 */
export type Format = string;

export interface DateFactoryParts {
    day: number;
    month: Month;
    year?: number;
    weekday?: Weekday;
}

export interface DateFactory {
    create(parts: DateFactoryParts): Date;
}

export interface PatternParser<V> {
    parse(value: string): V;
    pattern: string;
}

export interface ParserBuilder<V> {
    build(locale:string): PatternParser<V>;
    namesFor(locale: string, options: Options): string[];
}

export interface Datum<V> {
    name: string;
    value: V;
}

export type MonthDatum = Datum<Month>;
export type WeekdayDatum = Datum<Weekday>;

export interface LocalisedData<V extends Datum<any>> {
    [locale: string] : V[];
}

export interface Dependencies {
    factory?: DateFactory;
    monthsData?: LocalisedData<MonthDatum>;
    weekdaysData?: LocalisedData<WeekdayDatum>;
}

export interface Options extends Dependencies {
    year?: 'numeric' | '2-digit';
    month?: MonthFormat;
    day?: 'numeric' | '2-digit';
    weekday?: WeekdayFormat;
    separators?: string;
    format?: Format;
    strict?: boolean;
}

export const defaultOptions: Options = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: 'long'
};

/**
 * Human readable and ISO 8601 compatible
 */
export enum Weekday {
    Monday = 1,
    Tuesday,
    Wednesday,
    Thursday,
    Friday,
    Saturday,
    Sunday
}

export function weekdayOf(date: Date): Weekday {
    const result = date.getUTCDay();
    if (result === 0) return Weekday.Sunday;
    return result;
}

/**
 * Human readable and ISO 8601 compatible
 */
export enum Month {
    January = 1,
    February,
    March,
    April,
    May,
    June,
    July,
    August,
    September,
    October,
    November,
    December
}


export function monthOf(date: Date): Month {
    return date.getUTCMonth() + 1;
}

export function dayOf(date: Date): number {
    return date.getUTCDate();
}

export function yearOf(date: Date): number {
    return date.getUTCFullYear();
}

export const hasNativeToParts = typeof Intl.DateTimeFormat.prototype.formatToParts == 'function';

export class Days {
    static milliseconds = 24 * 60 * 60 * 1000;

    static startOf(value: Date) {
        return date(yearOf(value), monthOf(value), dayOf(value));
    }

    static add(date: Date, days: number) {
        const newDate = new Date(date.getTime());
        newDate.setUTCDate(date.getUTCDate() + days);
        return newDate;
    }

    static subtract(date: Date, days: number) {
        return Days.add(date, days * -1);
    }

    static between(a: Date, b: Date): number {
        return Math.abs((a.getTime() - b.getTime()) / Days.milliseconds);
    }
}

