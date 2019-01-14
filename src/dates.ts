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
    day: "numeric",
    weekday: 'long',
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

function replace(regex: RegExp, value: string, replacer: (match: RegExpExecArray) => string, nonMatchedReplacer: (a: string) => string = (value) => value) {
    const result = [];

    let position = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(value)) != null) {
        result.push(nonMatchedReplacer(value.substring(position, match.index)));
        result.push(replacer(match));
        position = regex.lastIndex;
    }
    result.push(nonMatchedReplacer(value.substring(position)));

    return result.join("");
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
        return lazy(this, 'weekdayLiteral', this.weekdays.length ? this.weekdays[this.weekday - 1] : 'Unknown');
    }

    get literalRegex(): RegExp {
        const literals = [this.year, this.monthLiteral, this.day, this.weekdayLiteral];
        const literalRegex = new RegExp(`(?:(${literals.join(')|(')}))`, 'g');
        return lazy(this, 'literalRegex', literalRegex);
    }


    get regexParser(): RegexParser {
        let yearIndex = -1;
        let monthIndex = -1;
        let dayIndex = -1;
        let weekdayIndex = -1;

        let index = 0;
        const pattern = replace(this.literalRegex, this.formatted, match => {
            index++;
            if (match[1]) {
                yearIndex = index;
                return '(\\d{4})';
            }
            if (match[2]) {
                monthIndex = index;
                return `((?:\\d{1,2}|${this.months.join('|')}))`;
            }
            if (match[3]) {
                dayIndex = index;
                return '(\\d{1,2})';
            }
            if (match[4]) {
                weekdayIndex = index;
                return `((?:${this.weekdays.join('|')}))`;
            }
            return '';
        }, noMatch => `[${noMatch}]*`);
        console.log(pattern);

        const groups = {
            year: numeric(yearIndex),
            month: this.monthLiteral === this.month.toString() ? numeric(monthIndex) : lookup(monthIndex, this.months),
            day: numeric(dayIndex),
            weekday: lookup(weekdayIndex, this.weekdays),
        };

        return new RegexParser(new RegExp(pattern), groups);

    }


}

export function localeParser(locale?: string, options: Options = defaultOptions): DateParser {
    const exampleDate = new ExampleDate(locale, options);
    return exampleDate.regexParser;
}

export function months(locale?: string, options: Options = defaultOptions): string[] {
    return range(1, 12)
        .map(i => format(date(2000, i, 1), locale, {month: options.month}))
        .map(s => s.replace('.', ''))
        .toArray();
}

export function weekdays(locale?: string, options: Options = defaultOptions): string[] {
    return range(1, 7)
        .map(i => format(date(2000, 1, i + 2), locale, {weekday: options.weekday}))
        .toArray();
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
