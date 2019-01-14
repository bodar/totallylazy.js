import {range} from "./sequence";
import {lazy} from "./lazy";

export function date(year: number, month?: number, day?: number): Date {
    return new Date(year, month ? month - 1 : 1, day ? day : 1);
}

export interface Options {
    year?: 'numeric' | '2-digit';
    month?: 'numeric' | '2-digit' | 'narrow' | 'short' | 'long';
    day?: 'numeric' | '2-digit';
    weekday?: 'narrow' | 'short' | 'long';
}

export const defaultOptions: Options = {
    year: "numeric",
    month: "numeric",
    day: "numeric"
};

export class Formatters {
    static cache: { [key: string]: Intl.DateTimeFormat } = {};

    static create(locale: string = 'default', options: Options = defaultOptions) {
        const key = JSON.stringify({locale, options});
        return Formatters.cache[key] = Formatters.cache[key] || new Intl.DateTimeFormat(locale, options);
    }
}

export function format(value: Date, locale?: string, options: Options = defaultOptions): string {
    return Formatters.create(locale, options).format(value);
}

export function parse(value: string, locale?: string, options: Options = defaultOptions): Date {
    return localeParser(locale, options).parse(value);
}


export class ExampleDate {
    constructor(private locale?: string,
                private options: Options = defaultOptions,
                private year = 3333,
                private month = 11,
                private day = 22,
                private weekday = 7 /*Sunday*/) {
    }

    get date(): Date {
        return lazy(this, 'date', date(this.year, this.month, this.day));
    }

    get formatted(): string {
        return lazy(this, 'formatted', Formatters.create(this.locale, this.options).format(this.date));
    }

    get months(): string[] {
        return lazy(this, 'months', months(this.locale, this.options));
    }

    get monthLiteral(): string {
        return lazy(this, 'monthLiteral', this.months[this.month - 1]);
    }

    get weekdays(): string[] {
        return lazy(this, 'weekdays', weekdays(this.locale, this.options));
    }

    get weekdayLiteral(): string {
        return lazy(this, 'weekdayLiteral', this.weekdays[this.weekday - 1]);
    }

    get regex(): RegExp {
        const pattern = this.formatted.
        replace(this.year.toString(), '(\\d{4})').
        replace(this.monthLiteral, `((?:\\d{1,2}|${this.months.join('|')}))`).
        replace(this.weekdayLiteral, `((?:${this.weekdays.join('|')}))`).
        replace(this.day.toString(), '(\\d{1,2})');
        return lazy(this, 'regex', new RegExp(pattern));
    }

    get groups(): RegexGroups {
        const match = this.formatted.match(this.regex);
        if (!match) throw new Error();
        const monthIndex = match.indexOf(this.monthLiteral);
        const weekdayIndex = match.indexOf(this.weekdayLiteral);
        const groups = {
            year: numeric(match.indexOf(this.year.toString())),
            month: this.monthLiteral === this.month.toString() ? numeric(monthIndex) : lookup(monthIndex, this.months),
            day: numeric(match.indexOf(this.day.toString())),
            weekday: lookup(weekdayIndex, this.weekdays),
        };
        return lazy(this, 'groups', groups);
    }

    toString() {
        return this.regex.toString();
    }


}

export function localeParser(locale?: string, options: Options = defaultOptions): DateParser {
    const exampleDate = new ExampleDate(locale, options);
    return new RegexParser(exampleDate.regex, exampleDate.groups);
}

export function months(locale?: string, options: Options = defaultOptions): string[] {
    return range(1, 12).map(i => format(date(2000, i, 1), locale, {month: options.month})).toArray();
}

export function weekdays(locale?: string, options: Options = defaultOptions): string[] {
    return range(1, 7).map(i => format(date(2000, 1, i + 2), locale, {weekday: options.weekday})).toArray();
}

export type OptionHandler = (match: RegExpMatchArray) => number;

export const numeric = (index: number): OptionHandler => (match: RegExpMatchArray): number => {
    return parseInt(match[index]);
};

export const lookup = (index: number, months: string[]): OptionHandler => (match: RegExpMatchArray): number => {
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
