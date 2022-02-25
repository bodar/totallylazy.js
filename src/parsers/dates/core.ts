import {Month, Weekday} from "../../dates";

declare global {
    interface String {
        toLocaleLowerCase(locale: string): string;

        toLocaleUpperCase(locale: string): string;
    }
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

export interface DateFactory {
    create(parts: DateFactoryParts): Date;
}

export interface DateFactoryParts {
    day: number;
    month: Month;
    year?: number;
    weekday?: Weekday;
}

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

export const defaultOptions: Options = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: 'long'
};

