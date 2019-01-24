import {date, defaultOptions, Months, Options, Weekdays} from "./index";
import {lazy} from "../lazy";
import {namedGroups, NamedGroups, replace} from "../characters";
import DateTimeFormatPart = Intl.DateTimeFormatPart;
import DateTimeFormat = Intl.DateTimeFormat;

export class Formatters {
    static cache: { [key: string]: Intl.DateTimeFormat } = {};

    static create(locale: string = 'default', options: Options = defaultOptions) {
        const key = JSON.stringify({locale, options});
        return Formatters.cache[key] = Formatters.cache[key] || (() => {
            const clone = {...options};
            const keys = Object.keys(clone).length;
            const formatter = new Intl.DateTimeFormat(locale, clone);
            if(Object.keys(clone).length != keys) throw new Error(`Unsupported options provided: ${JSON.stringify(options)}`);
            return formatter;
        })();
    }
}

export function format(value: Date, locale?: string, options: Options = defaultOptions): string {
    return Formatters.create(locale, options).format(value);
}

export const hasNativeFormatToParts = typeof Intl.DateTimeFormat.prototype.formatToParts == 'function';

export function formatData(value: Date, locale: string = 'default', options: Options = defaultOptions): DateTimeFormatPart[] {
    const formatter = Formatters.create(locale, options);
    if(hasNativeFormatToParts) return formatter.formatToParts(value);
    return FormatToParts.create(locale, options).formatToParts(value);
}

export class FormatToParts {
    private constructor(private locale: string,
                        private options: Options = defaultOptions,
                        private year = 3333,
                        private monthValue = 11,
                        private day = 22,
                        private weekdayValue = 7 /*Sunday*/) {
    }

    static cache: { [key: string]: FormatToParts } = {};

    static create(locale: string, options: Options = defaultOptions): FormatToParts {
        const key = JSON.stringify({locale, options});
        return FormatToParts.cache[key] = FormatToParts.cache[key] || new FormatToParts(locale, options);
    }

    @lazy get formatter(): DateTimeFormat {
        return Formatters.create(this.locale, this.options);
    }

    @lazy get formatted(): string {
        return this.formatter.format(date(this.year, this.monthValue, this.day));
    }

    @lazy get months(): Months {
        return new Months(this.locale, [Months.dataFor(this.locale, this.options)]);
    }

    @lazy get month(): string {
        return this.months.get(this.monthValue).name;
    }

    @lazy get weekdays(): Weekdays {
        return new Weekdays(this.locale, [Weekdays.dataFor(this.locale, this.options)]);
    }

    @lazy get weekday(): string {
        return this.weekdays.get(this.weekdayValue).name;
    }

    @lazy get learningNamesPattern(): NamedGroups {
        if(!this.month) throw new Error("Unable to detect months");
        if(!this.weekday) throw new Error("Unable to detect weekday");
        const namedPattern = `(?:${Object.keys(this.options).map(key => `(?<${key}>${(this as any)[key]})`).join("|")})`;
        return namedGroups(namedPattern);
    }

    @lazy get actualNamesPattern():NamedGroups {
        const {names: learningNames, pattern: learningPattern} = this.learningNamesPattern;
        const learningRegex = new RegExp(learningPattern, 'g');

        const result: string[] = [];
        let count = 0;
        replace(learningRegex, this.formatted, match => {
            const [type] = Object.keys(this.options).map(k => match[learningNames[k]] ? k : undefined).filter(Boolean);
            if(!type) throw new Error();
            if(type == 'year') result.push('(?<year>\\d{4})');
            if(type == "month") result.push( `(?<month>(?:\\d{1,2}|${this.months.pattern}))`);
            if(type == "day") result.push( '(?<day>\\d{1,2})');
            if(type == "weekday") result.push(`(?<weekday>${this.weekdays.pattern})`);
            return "";
        }, noMatch => {
            if(noMatch) {
                result.push(`(?<literal-${count++}>[${noMatch}]+?)`);
            }
            return "";
        });

        return namedGroups("^" + result.join("") + "$");
    }

    formatToParts(date: Date): DateTimeFormatPart[] {
        const {names, pattern} = this.actualNamesPattern;

        const actualResult = this.formatter.format(date);
        const regex = new RegExp(pattern);

        const parts: DateTimeFormatPart[] = [];
        const match = actualResult.match(regex);
        if(!match) {
            throw new Error(`${pattern} did not match ${actualResult}` );
        }
        Object.entries(names).map(([type, index]) => {
            let value = match[index];
            if(type.indexOf('literal') != -1) type = 'literal';
            parts.push({type: (type as any), value});
        });

        return parts;
    }
}