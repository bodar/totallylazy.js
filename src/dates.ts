import {range} from "./sequence";

export function date(year: number, month?: number, day?: number): Date {
    return new Date(year, month ? month - 1 : 1, day ? day : 1);
}

export interface Options {
    year?: 'numeric' | '2-digit';
    month?: 'numeric' | '2-digit' | 'narrow' | 'short' | 'long' ;
    day?: 'numeric' | '2-digit';
    weekday?: 'narrow' | 'short' | 'long';
}

export const defaultOptions: Options = {
    year: "numeric",
    month: "numeric",
    day: "numeric"
};

function formatter(locale?: string, options: Options = defaultOptions) {
    return new Intl.DateTimeFormat(locale, options);
}

export function format(value: Date, locale?: string, options: Options = defaultOptions): string {
    return formatter(locale, options).format(value);
}

export function parse(value: string, locale?: string, options: Options = defaultOptions): Date {
    return localeParser(locale, options).parse(value);
}

export function localeParser(locale?: string, options: Options = defaultOptions): DateParser {
    const f = formatter(locale, options);
    const d = date(3333, 11, 22); // Sunday
    const fd = f.format(d);
    const m = months(locale, options);
    const monthLiteral = m[11-1];
    const w = weekdays(locale, options);
    const weekdayLiteral = w[7-1];
    const regex = new RegExp(fd.
    replace('3333', '(\\d{4})').
    replace(monthLiteral, `((?:\\d{1,2}|${m.join('|')}))`).
    replace(weekdayLiteral, `((?:${w.join('|')}))`).
    replace('22', '(\\d{1,2})'));
    const match = fd.match(regex);
    if (!match) throw new Error();
    const monthIndex = match.indexOf(monthLiteral);
    const weekdayIndex = match.indexOf(weekdayLiteral);
    const groups = {
        year: numeric(match.indexOf('3333')),
        month: monthLiteral === '11' ? numeric(monthIndex) : lookup(monthIndex, m),
        day: numeric(match.indexOf('22')),
        weekday: lookup(weekdayIndex, w),
    };
    return new RegexParser(regex, groups);
}

export function months(locale?: string, options: Options = defaultOptions){
    return range(1,12).map(i => format(date(2000, i, 1), locale, {month: options.month})).toArray();
}

export function weekdays(locale?: string, options: Options = defaultOptions){
    return range(1,7).map(i => format(date(2000, 1, i + 2), locale, {weekday: options.weekday})).toArray();
}

export type OptionHandler = (match: RegExpMatchArray) => number;

export const numeric = (index: number): OptionHandler => (match: RegExpMatchArray): number => {
    return parseInt(match[index]);
};

export const lookup = (index: number, months:string[]): OptionHandler => (match: RegExpMatchArray): number => {
    return months.indexOf(match[index]) + 1;
};

export interface DateParser {
    parse(value: string): Date;
}

export interface RegexGroups {
    year: OptionHandler;
    month: OptionHandler;
    day: OptionHandler;
    weekday: OptionHandler;
}

export class RegexParser implements DateParser {
    constructor(private regex: RegExp, private groups: RegexGroups) {
    }

    parse(value: string): Date {
        const match = value.match(this.regex);
        if (!match) throw new Error(this.regex + 'did not match ' + value);
        return date(this.groups.year(match), this.groups.month(match), this.groups.day(match));
    }
}
