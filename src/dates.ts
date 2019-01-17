import {lazy} from "./lazy";

declare global {
    interface String {
        toLocaleLowerCase(locale?: string): string;
    }
}


export function date(year: number, month?: number, day?: number): Date {
    return new Date(year, month ? month - 1 : 1, day ? day : 1);
}

export type MonthFormat = 'numeric' | '2-digit' | 'narrow' | 'short' | 'long';

export interface Options {
    year?: 'numeric' | '2-digit';
    month?: MonthFormat;
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

export function parse(value: string, locale?: string, options?: Options): Date {
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
    private constructor(private locale?: string,
                        private options: Options = defaultOptions,
                        private year = 3333,
                        private month = 11,
                        private day = 22,
                        private weekday = 7 /*Sunday*/) {
    }

    static cache: { [key: string]: ExampleDate } = {};

    static create(locale: string = 'default', options: Options = defaultOptions): ExampleDate {
        const key = JSON.stringify({locale, options});
        return ExampleDate.cache[key] = ExampleDate.cache[key] || new ExampleDate(locale, options);
    }

    get date(): Date {
        return lazy(this, 'date', date(this.year, this.month, this.day));
    }

    get formatted(): string {
        return lazy(this, 'formatted', Formatters.create(this.locale, this.options).format(this.date).toLocaleLowerCase(this.locale));
    }

    get months(): string[] {
        return lazy(this, 'months', months(this.locale, this.options).map(l => l.toLocaleLowerCase(this.locale)));
    }

    get monthLiteral(): string {
        return lazy(this, 'monthLiteral', this.months[this.month - 1]);
    }

    get weekdays(): string[] {
        return lazy(this, 'weekdays', weekdays(this.locale, this.options).map(l => l.toLocaleLowerCase(this.locale)));
    }

    get weekdayLiteral(): string {
        return lazy(this, 'weekdayLiteral', this.weekdays.length ? this.weekdays[this.weekday - 1] : 'Unknown');
    }

    get literalRegex(): RegExp {
        const literals = [this.year, this.monthLiteral, this.day, this.weekdayLiteral];
        if( literals.length != literals.filter(Boolean).length) throw Error('Unable to build regex due to missing literal: ' + JSON.stringify(literals));
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

        const groups = {
            year: numeric(yearIndex),
            month: this.monthLiteral === this.month.toString() ? numeric(monthIndex) : lookup(monthIndex, this.months),
            day: numeric(dayIndex),
            weekday: lookup(weekdayIndex, this.weekdays),
        };

        return lazy(this, 'regexParser', new RegexParser(new RegExp(pattern), groups, this.locale));

    }
}

export const defaultParserOptions: Options[] = [
    {year: 'numeric', month: 'long', day: 'numeric', weekday: "long"},
    {year: 'numeric', month: 'short', day: 'numeric', weekday: 'short'},
    {year: 'numeric', month: 'numeric', day: 'numeric'},
    {year: 'numeric', month: 'short', day: 'numeric'},
    {year: 'numeric', month: 'long', day: 'numeric'},
];

export function localeParser(locale?: string, options?: Options): DateParser {
    if (!options) {
        return parsers(...defaultParserOptions.map(o => localeParser(locale, o)))
    }
    return ExampleDate.create(locale, options).regexParser;
}

export function months(locale?: string, monthFormat: MonthFormat | Options = 'long'): string[] {
    const options: Options = typeof monthFormat == 'string' ? {month: monthFormat} : monthFormat;
    delete options.weekday;
    const result = [];

    for (let i = 1; i <= 12; i++) {
        result.push(format(date(2000, i, 1), locale, options)
            .replace(/\./g, ''));
    }
    return Object.keys(options).length  == 1 ? result : different(result);
}

export function weekdays(locale?: string, options: Options = defaultOptions): string[] {
    const result = [];
    for (let i = 1; i <= 7; i++) {
        result.push(format(date(2000, 1, i + 2), locale, {weekday: options.weekday}));
    }
    return result;
}

export function prefix(charactersA:string[], charactersB:string[]): number{
    for (let i = 0; i < charactersA.length; i++) {
        const characterA = charactersA[i];
        const characterB = charactersB[i];
        if(characterA != characterB) return i;
    }
    return charactersA.length;
}

export function suffix(charactersA:string[], charactersB:string[]): number {
    return prefix([...charactersA].reverse(), [...charactersB].reverse());
}

export function different(values:string[]): string[] {
    const characters = values.map(v => [...v]);

    const [smallestPrefix, smallestSuffix] = characters.reduce(([sp, ss], current, i) => {
        const next = i < characters.length -1  ? characters[i + 1] : characters[0];
        const p = prefix(current, next);
        const s = suffix(current, next);
        return [p < sp ? p : sp, s < ss ? s : ss];
    }, [Number.MAX_VALUE, Number.MAX_VALUE]);

    return characters.map((current) => {
        return current.slice(smallestPrefix, -smallestSuffix).join('')
    });
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

export class CompositeDateParser implements DateParser {
    constructor(private readonly parsers: DateParser[]) {
    }

    parse(value: string): Date {
        for (const parser of this.parsers) {
            try {
                const result = parser.parse(value);
                if (result) return result;
            } catch (ignore) {
            }
        }
        throw new Error("Unable to parse date: " + value);
    }
}

export function parsers(...parsers: DateParser[]): DateParser {
    return new CompositeDateParser(parsers);
}

export interface RegexGroups {
    year: OptionHandler;
    month: OptionHandler;
    day: OptionHandler;
    weekday: OptionHandler;
}

export class RegexParser implements DateParser {
    constructor(private regex: RegExp, private groups: RegexGroups, private locale?: string) {
    }

    parse(value: string): Date {
        const match = value.toLocaleLowerCase(this.locale).match(this.regex);
        if (!match) throw new Error(`Locale: ${this.locale} ${this.regex} did not match ${value}`);
        return date(this.groups.year(match), this.groups.month(match), this.groups.day(match));
    }
}
