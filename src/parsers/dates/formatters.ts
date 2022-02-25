import {cache} from "../../cache";
import {defaultOptions, MonthFormat, Options, WeekdayFormat} from "./core";
import {characters, isNamedMatch, NamedRegExp} from "../../characters";
import {date, Month, Weekday} from "../../dates";
import {digits, Numerals} from "../numerals";
import {lazy} from "../../lazy";
import {array} from "../../array";
import {map} from "../../transducers";
import {DatumLookup} from "../datumLookup";
import {valueFromParts} from "./valueFromParts";
import {optionsFrom} from "./optionsFrom";
import {partsFrom} from "./partsFrom";
import {BaseDataExtractor} from "./baseDataExtractor";
import {DataExtractor} from "./dataExtractor";
import {range} from "./range";
import {cleanValue} from "../parsing";
import {Datum} from "../datum";
import {flatten} from "../../arrays";
import DateTimeFormat = Intl.DateTimeFormat;
import DateTimeFormatPart = Intl.DateTimeFormatPart;
import DateTimeFormatPartTypes = Intl.DateTimeFormatPartTypes;
import {get} from '../../functions';


const months_cache: { [key: string]: string[] } = {};

export function months(locale: string, monthFormat: MonthFormat | Options = 'long'): string[] {
    const key = JSON.stringify({locale, monthFormat});
    return months_cache[key] = months_cache[key] || (() => {
        const options: Options = {...typeof monthFormat == 'string' ? {month: monthFormat} : monthFormat};
        if (!options.month) return [];

        const dates = range(1, 12).map(i => date(2000, i, 1));

        new NativeDataExtractor(locale, options, dates, 'month').extract().map(cleanValue);
    })();
}

export type MonthDatum = Datum<Month>;

export class Months extends DatumLookup<Month> {
    private readonly numerals: Numerals

    constructor(data: Datum<Month>[], locale: string) {
        super(data);
        this.numerals = Numerals.get(locale);
    }

    parse(value: string): Month {
        const number = get(() => this.numerals.parse(value));
        return isNaN(number) ? super.parse(cleanValue(value)) : number;
    }

    static formats: Options[] = [
        {month: "long"}, {month: "short"},
        {year: 'numeric', month: "long", day: 'numeric'},
        {year: 'numeric', month: 'short', day: 'numeric'},
    ];

    static cache: { [key: string]: Months } = {};

    static get(locale: string, additionalData: MonthDatum[] = []): Months {
        return Months.cache[locale] = Months.cache[locale] || Months.create(locale, additionalData);
    }

    static set(locale: string, months: Months): Months {
        return Months.cache[locale] = months;
    }

    static create(locale: string, additionalData: MonthDatum[] = []): Months {
        return new Months([...Months.generateData(locale), ...additionalData], locale);
    }

    static generateData(locale: string): MonthDatum[] {
        return flatten(Months.formats.map(f => Months.dataFor(locale, f)));
    }

    static dataFor(locale: string, options: Options): MonthDatum[] {
        return months(locale, options).map((m, i) => ({name: m, value: i + 1}));
    }
}

const weekdays_cache: { [key: string]: string[] } = {};

export function weekdays(locale: string, weekdayFormat: WeekdayFormat | Options = 'long'): string[] {
    const key = JSON.stringify({locale, weekdayFormat});
    return weekdays_cache[key] = weekdays_cache[key] || (() => {
        const options: Options = {...typeof weekdayFormat == 'string' ? {weekday: weekdayFormat} : weekdayFormat};
        if (!options.weekday) return [];

        const dates = range(1, 7).map(i => date(2000, 1, i + 2));

        return new NativeDataExtractor(locale, options, dates, 'weekday').extract().map(cleanValue);
    })();
}

export type WeekdayDatum = Datum<Weekday>;

export class Weekdays extends DatumLookup<Weekday> {
    static formats: Options[] = [
        {weekday: "long"}, {weekday: "short"},
        {year: 'numeric', month: "numeric", day: 'numeric', weekday: 'long'},
        {year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short'}
    ];

    parse(value: string): Weekday {
        return super.parse(cleanValue(value));
    }

    static cache: { [key: string]: Weekdays } = {};

    static get(locale: string, additionalData: WeekdayDatum[] = []): Weekdays {
        return Weekdays.cache[locale] = Weekdays.cache[locale] || Weekdays.create(locale, additionalData);
    }

    static set(locale: string, weekdays: Weekdays): Weekdays {
        return Weekdays.cache[locale] = weekdays;
    }

    static create(locale: string, additionalData: WeekdayDatum[] = []): Weekdays {
        return new Weekdays([...Weekdays.generateData(locale), ...additionalData]);
    }

    static generateData(locale: string): WeekdayDatum[] {
        return flatten(Weekdays.formats.map(f => Weekdays.dataFor(locale, f)));
    }

    static dataFor(locale: string, options: Options): WeekdayDatum[] {
        return weekdays(locale, options).map((m, i) => ({name: m, value: i + 1}));
    }
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
        return Months.create(this.locale, Months.dataFor(this.locale, this.options));
    }

    @lazy get month(): string {
        return months(this.locale, this.options)[this.monthValue - 1];
    }

    @lazy get weekdays(): Weekdays {
        return new Weekdays(Weekdays.dataFor(this.locale, this.options));
    }

    @lazy get weekday(): string {
        return weekdays(this.locale, this.options)[this.weekdayValue - 1];
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
            if (isNamedMatch(value)) {
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

export class Formatters {
    @cache
    static create(locale: string, options: string | Options = defaultOptions): DateTimeFormat {
        if (typeof options === "string") return new SimpleFormat(locale, options);
        if (typeof options.format === "string") return new SimpleFormat(locale, options.format);
        return new ImprovedDateTimeFormat(locale, options);
    }

    // Slightly older versions of Safari implement the method but return an empty array!
    @cache
    static isNativelySupported(locale: string, options: Options = defaultOptions): boolean {
        const formatter = this.dateTimeFormat(locale, options);
        return typeof formatter.formatToParts == 'function' && formatter.formatToParts(new Date()).length > 0;
    }

    static dateTimeFormat(locale: string, options: Options) {
        return new Intl.DateTimeFormat(locale, {...options, timeZone: 'UTC'});
    }
}

export function exactFormat(locale: string, options: Options, dates: Date[]): string[] {
    const formatter = Formatters.create(locale, options);
    return dates.map(d => formatter.format(d));
}

export class NativeDataExtractor extends BaseDataExtractor implements DataExtractor {
    extract(): string[] {
        const formatter = Formatters.create(this.locale, this.options);
        return this.dates.map(d => valueFromParts(formatter.formatToParts(d), this.partType));
    }
}