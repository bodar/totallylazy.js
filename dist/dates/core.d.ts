import { DateFactory } from "./parsing";
declare global {
    interface String {
        toLocaleLowerCase(locale: string): string;
        toLocaleUpperCase(locale: string): string;
    }
}
export declare function date(year: number, month?: number, day?: number): Date;
export declare type MonthFormat = 'numeric' | '2-digit' | 'short' | 'long';
export declare type WeekdayFormat = 'short' | 'long';
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
export declare type Format = string;
export interface Options {
    year?: 'numeric' | '2-digit';
    month?: MonthFormat;
    day?: 'numeric' | '2-digit';
    weekday?: WeekdayFormat;
    separators?: string;
    format?: Format;
    strict?: boolean;
    factory?: DateFactory;
}
export declare const defaultOptions: Options;
/**
 * Human readable and ISO 8601 compatible
 */
export declare enum Weekday {
    Monday = 1,
    Tuesday = 2,
    Wednesday = 3,
    Thursday = 4,
    Friday = 5,
    Saturday = 6,
    Sunday = 7
}
export declare function weekdayOf(date: Date): Weekday;
/**
 * Human readable and ISO 8601 compatible
 */
export declare enum Month {
    January = 1,
    February = 2,
    March = 3,
    April = 4,
    May = 5,
    June = 6,
    July = 7,
    August = 8,
    September = 9,
    October = 10,
    November = 11,
    December = 12
}
export declare function monthOf(date: Date): Month;
export declare function dayOf(date: Date): number;
export declare function yearOf(date: Date): number;
