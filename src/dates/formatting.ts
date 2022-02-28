import {lazy} from "../lazy";
import {characters, isNamedMatch, NamedRegExp} from "../characters";
import {map} from "../transducers";
import DateTimeFormatPart = Intl.DateTimeFormatPart;
import DateTimeFormat = Intl.DateTimeFormat;
import DateTimeFormatPartTypes = Intl.DateTimeFormatPartTypes;
import {cache} from "../cache";
import {DatumLookup, digits, Numerals} from "../parsing";
import {array} from "../array";
import {date, defaultOptions, Format, Options, Weekday} from "./core";
import {Months, months, valueFromParts, Weekdays, weekdays} from "./datum";
import {optionsFrom, partsFrom} from "./parsing";

export class Formatters {
    @cache
    static create(locale: string , options: string | Options = defaultOptions): DateTimeFormat {
        if (typeof options === "string") return new SimpleFormat(locale, options);
        if (typeof options.format === "string") return new SimpleFormat(locale, options.format);
        return new ImprovedDateTimeFormat(locale, options);
    }

    // Slightly older versions of Safari implement the method but return an empty array!
    @cache
    static isNativelySupported(locale: string , options: Options = defaultOptions): boolean {
        const formatter = this.dateTimeFormat(locale, options);
        return typeof formatter.formatToParts == 'function' && formatter.formatToParts(new Date()).length > 0;
    }

    static dateTimeFormat(locale: string, options: Options) {
        return new Intl.DateTimeFormat(locale, {...options, timeZone: 'UTC'});
    }
}

export class ImprovedDateTimeFormat implements DateTimeFormat {
    constructor(private locale: string, private options: Options, private delegate: DateTimeFormat = ImprovedDateTimeFormat.create(locale, options)) {
    }

    private static create(locale: string, options: Options) {
        // Detect IE 11 bug
        const clone = {...options};
        const keys = Object.keys(clone).length;
        const result = Formatters.dateTimeFormat(locale, clone);
        if (Object.keys(clone).length != keys) throw new Error(`Unsupported DateTimeFormat options provided: ${JSON.stringify(options)}`);
        return result;
    }

    format(date?: Date | number): string {
        return characters(this.delegate.format(date)).join("");
    }

    formatToParts(date: Date | number = new Date()): Intl.DateTimeFormatPart[] {
        if (Formatters.isNativelySupported(this.locale, this.options)) {
            return this.delegate.formatToParts(date);
        } else {
            return DateParts.create(this.locale, this.options).toParts(typeof date === "number" ? new Date(date) : date);
        }
    }

    resolvedOptions(): Intl.ResolvedDateTimeFormatOptions {
        return this.delegate.resolvedOptions();
    }
}

export function format(value: Date, locale: string, options: Format | Options = defaultOptions): string {
    if(value == undefined) throw new Error("Date format requires a value");
    return Formatters.create(locale, options).format(value);
}

export class SimpleFormat implements DateTimeFormat {
    private partsInOrder: DateTimeFormatPart[];
    private options: Options;

    constructor(private locale: string, private value: string) {
        this.partsInOrder = partsFrom(value);
        this.options = optionsFrom(this.partsInOrder);
    }

    format(date?: Date | number): string {
        return this.formatToParts(date).map(p => p.value).join("");
    }

    formatToParts(raw: Date | number = new Date()): Intl.DateTimeFormatPart[] {
        const date = typeof raw === "number" ? new Date(raw) : raw;
        const partsWithValues = DateParts.create(this.locale, this.options).toParts(date);
        return this.partsInOrder.map(p => ({type: p.type, value: this.valueFor(partsWithValues, p.type, p.value)}));
    }

    private valueFor(partsWithValues: Intl.DateTimeFormatPart[], type: DateTimeFormatPartTypes, value: string): string {
        if (type === 'literal') return value;
        return valueFromParts(partsWithValues, type);
    }

    resolvedOptions(): Intl.ResolvedDateTimeFormatOptions {
        return {...this.options, locale: this.locale} as Intl.ResolvedDateTimeFormatOptions;
    }
}

export const hasNativeToParts = typeof Intl.DateTimeFormat.prototype.formatToParts == 'function';

export function formatData(value: Date, locale: string , options: Options = defaultOptions, native = hasNativeToParts): DateTimeFormatPart[] {
    const formatter = Formatters.create(locale, options);
    if (native) return formatter.formatToParts(value);
    return DateParts.create(locale, options).toParts(value);
}

export class DateParts {
    private constructor(private locale: string,
                        private options: Options = defaultOptions,
                        private yearValue = 3333,
                        private monthValue = 11,
                        private dayValue = 20,
                        private weekdayValue = Weekday.Friday,
                        private numerals = Numerals.get(locale)) {
    }

    @cache
    static create(locale: string, options: Options = defaultOptions): DateParts {
        return new DateParts(locale, options);
    }

    @lazy get formatter(): DateTimeFormat {
        return Formatters.create(this.locale, this.options);
    }

    @lazy get formatted(): string {
        return this.formatter.format(date(this.yearValue, this.monthValue, this.dayValue));
    }

    @lazy get months(): Months {
        return Months.create(this.locale, Months.dataFor(this.locale, this.options, false));
    }

    @lazy get month(): string {
        return months(this.locale, this.options, false)[this.monthValue - 1];
    }

    @lazy get weekdays(): Weekdays {
        return new Weekdays(Weekdays.dataFor(this.locale, this.options, false));
    }

    @lazy get weekday(): string {
        return weekdays(this.locale, this.options, false)[this.weekdayValue - 1];
    }

    @lazy get year(): string {
        return this.numerals.format(this.yearValue);
    }

    @lazy get day(): string {
        return this.numerals.format(this.dayValue);
    }

    @lazy get learningNamesPattern(): NamedRegExp {
        const template = (key: string) => `(?<${key}>${(this as any)[key]})`;
        const patterns = Object.keys(this.options).map(k => template(k));
        const namedPattern = `(?:${patterns.join("|")})`;
        return NamedRegExp.create(namedPattern);
    }

    @lazy get actualNamesPattern(): NamedRegExp {
        const d = digits(this.locale);
        const learningRegex = this.learningNamesPattern;

        const result = array(learningRegex.iterate(this.formatted), map(value => {
            if(isNamedMatch(value)) {
                let [type] = value.filter(n => Boolean(n.value)).map(n => n.name);
                if (!type) throw new Error();
                if (type == 'year') return `(?<year>[${d}]{4})`;
                else if (type == "day") return `(?<day>[${d}]{1,2})`;
                else if (type == "month") return `(?<month>(?:[${d}]{1,2}|${this.months.pattern}))`;
                else if (type == "weekday") return `(?<weekday>${this.weekdays.pattern})`;
            } else {
                    return `(?<literal>[${value}]+?)`;
            }
        }));

        const pattern = "^" + result.join("") + "$";
        return NamedRegExp.create(pattern);
    }

    toParts(date: Date): DateTimeFormatPart[] {
        const regex = this.actualNamesPattern;
        const actualResult = this.formatter.format(date);

        const match = regex.match(actualResult);
        if (match.length === 0) {
            throw new Error(`${regex} did not match ${actualResult}`);
        }

        const parts = match.map(m => {
            const type = this.getType(m.name, m.value);
            return {type, value: m.value};
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
        if (type === 'month' || type === 'weekday') {
            if (this.parsable(this.months, value)) return "month";
            if (this.parsable(this.weekdays, value)) return "weekday";
            return 'literal';
        }
        return type as any;
    }

    private parsable(lookup: DatumLookup<any>, value: string) {
        try {
            return Boolean(lookup.parse(value));
        } catch (e) {
            return false;
        }
    }
}