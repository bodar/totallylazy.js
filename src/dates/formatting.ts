import {date, DatumLookup, defaultOptions, months, Months, Options, weekdays, Weekdays} from "./index";
import {cache, lazy} from "../lazy";
import {namedGroups, NamedGroups, replace} from "../characters";
import DateTimeFormatPart = Intl.DateTimeFormatPart;
import DateTimeFormat = Intl.DateTimeFormat;
import DateTimeFormatPartTypes = Intl.DateTimeFormatPartTypes;

export class Formatters {
    @cache static create(locale: string = 'default', options: Options = defaultOptions) {
            // Detect IE 11 bug
            const clone = {...options};
            const keys = Object.keys(clone).length;
            const formatter = new Intl.DateTimeFormat(locale, clone);
            if (Object.keys(clone).length != keys) throw new Error(`Unsupported DateTimeFormat options provided: ${JSON.stringify(options)}`);
            return formatter;
    }
}

export function format(value: Date, locale?: string, options: Options = defaultOptions): string {
    return Formatters.create(locale, options).format(value);
}

export const hasNativeFormatToParts = typeof Intl.DateTimeFormat.prototype.formatToParts == 'function';

export function formatData(value: Date, locale: string = 'default', options: Options = defaultOptions, native = hasNativeFormatToParts): DateTimeFormatPart[] {
    const formatter = Formatters.create(locale, options);
    if (native) return formatter.formatToParts(value);
    return FormatToParts.create(locale, options).formatToParts(value);
}

export class FormatToParts {
    private constructor(private locale: string,
                        private options: Options = defaultOptions,
                        private year = 3333,
                        private monthValue = 11,
                        private day = 20,
                        private weekdayValue = 5 /*Friday*/) {
    }

    @cache static create(locale: string, options: Options = defaultOptions): FormatToParts {
        return new FormatToParts(locale, options);
    }

    @lazy get formatter(): DateTimeFormat {
        return Formatters.create(this.locale, this.options);
    }

    @lazy get formatted(): string {
        return this.formatter.format(date(this.year, this.monthValue, this.day));
    }

    @lazy get months(): Months {
        return new Months(this.locale, [Months.dataFor(this.locale, this.options, false)]);
    }

    @lazy get month(): string {
        return months(this.locale, this.options, false)[this.monthValue - 1];
    }

    @lazy get weekdays(): Weekdays {
        return new Weekdays(this.locale, [Weekdays.dataFor(this.locale, this.options, false)]);
    }

    @lazy get weekday(): string {
        return weekdays(this.locale, this.options, false)[this.weekdayValue - 1];
    }

    @lazy get learningNamesPattern(): NamedGroups {
        const template = (key: string) => `(?<${key}>${(this as any)[key]})`;
        const patterns = Object.keys(this.options).map(k => template(k));
        const namedPattern = `(?:${patterns.join("|")})`;
        return namedGroups(namedPattern);
    }

    @lazy get actualNamesPattern(): NamedGroups {
        const {names: learningNames, pattern: learningPattern} = this.learningNamesPattern;
        const learningRegex = new RegExp(learningPattern, 'g');

        const result: string[] = [];
        let count = 0;
        const literalHandler = (value: string) => {
            if (value) {
                result.push(`(?<literal-${count++}>[${value}]+?)`);
            }
        };
        replace(learningRegex, this.formatted, match => {
            let [type] = Object.keys(learningNames).map(k => match[learningNames[k]] ? k : undefined).filter(Boolean);
            if (!type) throw new Error();
            if (type == 'year') result.push('(?<year>\\d{4})');
            else if (type == "day") result.push('(?<day>\\d{1,2})');
            else if (type == "month") result.push(`(?<month>(?:\\d{1,2}|${this.months.pattern}))`);
            else if (type == "weekday") result.push(`(?<weekday>${this.weekdays.pattern})`);
            return "";
        }, value => {
            literalHandler(value);
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
        if (!match) {
            throw new Error(`${pattern} did not match ${actualResult}`);
        }
        Object.keys(names).map((type) => {
            let value = match[names[type]];
            type = this.getType(type, value);
            parts.push({type: (type as any), value});
        });

        return this.collapseLiterals(parts);
    }

    private collapseLiterals(parts: DateTimeFormatPart[]): DateTimeFormatPart[] {
        for (let i = 0; i < parts.length; i++) {
            const current = parts[i];
            if (current.type === "literal") {
                let position = i + 1;
                while (true) {
                    const next = parts[position];
                    if (!(next && next.type === "literal")) break;
                    current.value = current.value + next.value;
                    parts.splice(position, 1);
                }
            }
        }
        return parts;
    }

    private getType(type: string, value: string): DateTimeFormatPartTypes {
        type = type.split('-')[0];
        if (type === 'month' || type === 'weekday') {
            if (this.parsable(this.months, value)) return "month";
            if (this.parsable(this.weekdays, value)) return "weekday";
            return 'literal';
        }
        return type as any;
    }

    private parsable(lookup: DatumLookup, value: string) {
        try {
            return Boolean(lookup.parse(value));
        } catch (e) {
            return false;
        }
    }
}