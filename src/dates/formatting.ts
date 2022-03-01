import {lazy} from "../lazy";
import {characters, NamedMatch, NamedRegExp} from "../characters";
import {flatMap, map, zip} from "../transducers";
import {cache, caching} from "../cache";
import {array} from "../array";
import {
    date,
    DateFactory,
    DateFactoryParts,
    Datum,
    defaultOptions,
    Format,
    Month,
    MonthFormat,
    Options,
    Weekday,
    WeekdayFormat
} from "./core";
import {flatten, unique} from "../arrays";
import {get} from "../functions";
import {extraDelimiters, mappingParser, namedRegexParser, or, Parser, preProcess} from "../parsing";
import {Mapper} from "../collections";
import {formatData, Formatters, optionsFrom, partsFrom, valueFromParts} from "./format";
import {atBoundaryOnly, boundaryDelimiters, cleanValue} from "./functions";
import {DatumLookup} from "./datum";
import DateTimeFormatPart = Intl.DateTimeFormatPart;
import DateTimeFormatPartTypes = Intl.DateTimeFormatPartTypes;

export type Numeral = Datum<number>;

export class Numerals extends DatumLookup<number> {
    constructor(data: Datum<number>[], private locale: string) {
        super(data);
    }

    static cache: { [key: string]: Numerals } = {};

    static get(locale: string, additionalData: Numeral[] = []): Numerals {
        return Numerals.cache[locale] = Numerals.cache[locale] || Numerals.create(locale, additionalData);
    }

    static create(locale: string, additionalData: Numeral[] = []): Numerals {
        return new Numerals([...Numerals.generateData(locale), ...additionalData], locale);
    }

    static generateData(locale: string): Numeral[] {
        const digits = numberFormatter(locale).format(1234567890).replace(/[,. '٬٫]/g, '');
        return array(characters(digits), zip([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]), map(([c, d]) => ({name: c, value: d})));
    }

    parse(value: string): number {
        const number = numberOf(value);
        return !isNaN(number) ? number : super.parse(value);
    }

    @lazy get pattern(): string {
        const characters = this.characters.join('');
        if (characters === '0123456789') return '\\d';
        return `\\d${characters}`;
    }

    format(value: number): string {
        return numberFormatter(this.locale).format(value);
    }
}

export const numberFormatter = caching((locale: string) => new Intl.NumberFormat(locale, {useGrouping: false}));

export class Spaces {
    static codes: string[] = [32, 160, 8239].map(code => String.fromCharCode(code));
    static spaces = Spaces.codes.join('');
    static pattern = new RegExp(`[${Spaces.spaces}]`, 'g');

    static handle(value: string): string {
        return Spaces.codes.indexOf(value) != -1 ? Spaces.spaces : value;
    }

    static remove(value: string): string {
        if (!value) return value;
        return value.replace(Spaces.pattern, '');
    }
}

const allowedSeparators = `٬٫,.'’‘${Spaces.spaces}`;
export const numberPattern = caching((locale: string) => {
    const d = Numerals.get(locale).pattern;
    return `-?(?:[${d}]+[${allowedSeparators}])*[${d}]+`;
});

export function mapIgnoreError<A, B>(mapper: Mapper<A, B>) {
    return flatMap((value: A) => {
        try {
            return [mapper(value)]
        } catch (e) {
            return [];
        }
    });
}

const separatorsPattern = NamedRegExp.create(`(?<separator>[${allowedSeparators}])`);

export function separatorsOf(amount: string): string[] {
    return array(separatorsPattern.exec(amount), map(([match]) => match.value));
}

export type AllowedDecimalSeparators = '.' | ',' | '٫';

export function isDecimalSeparator(value: any): value is AllowedDecimalSeparators {
    return value && typeof value === "string" && value === '.' || value === ',' || value === '٫';
}

export function decimalSeparator(value: any): AllowedDecimalSeparators {
    if (isDecimalSeparator(value)) return value;
    throw new Error(`Invalid decimal separator${value}`);
}

export class NumberParser implements Parser<number> {
    readonly strictNumberPattern: RegExp;
    readonly globalNumberPattern: NamedRegExp;

    constructor(private decimalSeparator: (amount: string) => AllowedDecimalSeparators, private locale: string) {
        this.strictNumberPattern = new RegExp(`^${numberPattern(locale)}$`);
        this.globalNumberPattern = NamedRegExp.create(`(?<number>${numberPattern(locale)})`, 'g');
    }

    parse(value: string): number {
        if (!this.strictNumberPattern.test(value)) throw new Error(`Unable to parse '${value}'`);
        return this.parseSingle(value);
    }

    parseAll(value: string): number[] {
        return array(this.globalNumberPattern.exec(value), mapIgnoreError(([match]) => this.parseSingle(match.value.trim())));
    }

    private parseSingle(value: string, decimalSeparator = this.decimalSeparator(value)): number {
        const separators = separatorsOf(value);
        if (separators.length === 0) return this.numberOf(value, decimalSeparator);
        const lastSeparator = separators[separators.length - 1];
        const groupSeparators = lastSeparator === decimalSeparator ? separators.slice(0, separators.length - 1) : separators;
        if (groupSeparators.indexOf(decimalSeparator) !== -1) throw new Error(`Unable to parse '${value}'`);
        if (unique(groupSeparators).length > 1) throw new Error(`Unable to parse '${value}'`);

        return this.numberOf(value, decimalSeparator);
    }

    private convert(value: string, decimalSeparator: AllowedDecimalSeparators): string {
        const numerals = Numerals.get(this.locale);
        return characters(value).map(c => {
            if (c === decimalSeparator) return '.';
            if (c === '-') return '-';
            const number = get(() => numerals.parse(c));
            if (isNaN(number)) return '';
            return number.toString();
        }).join('');
    }

    private numberOf(value: string, decimalSeparator: AllowedDecimalSeparators) {
        const text = this.convert(value, decimalSeparator);
        const result = numberOf(text);
        if (isNaN(result)) {
            throw new Error(`Unable to parse '${value}'`);
        }
        return result;
    }
}

export type Locale = string;

export function numberParser(): Parser<number>;
export function numberParser(decimalSeparatorOrLocale: AllowedDecimalSeparators | Locale): Parser<number>;
export function numberParser(decimalSeparator: AllowedDecimalSeparators, locale: Locale): Parser<number>;
export function numberParser(decimalSeparatorOrLocale?: AllowedDecimalSeparators | Locale, locale: Locale = 'en'): Parser<number> {
    if (!decimalSeparatorOrLocale) return numberParser(locale);
    if (isDecimalSeparator(decimalSeparatorOrLocale)) return new NumberParser(ignore => decimalSeparatorOrLocale, locale);
    return numberParser(inferDecimalSeparator(decimalSeparatorOrLocale), decimalSeparatorOrLocale);
}

export const inferDecimalSeparator = caching((locale: string) =>
    get(() => decimalSeparator(new Intl.NumberFormat(locale).formatToParts(.1).find(e => e.type === 'decimal')!.value), '.'));

export function numberOf(value: string): number {
    if (!value || value.trim().length === 0) return NaN;
    return Number(value);
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

// No dep version
function range(start: number, end: number): number[] {
    const result = [];
    for (let i = start; i <= end; i++) {
        result.push(i);
    }
    return result;
}

const months_cache: { [key: string]: string[] } = {};

export function months(locale: string, monthFormat: MonthFormat | Options = 'long'): string[] {
    const key = JSON.stringify({locale, monthFormat});
    return months_cache[key] = months_cache[key] || (() => {
        const options: Options = {...typeof monthFormat == 'string' ? {month: monthFormat} : monthFormat};
        if (!options.month) return [];

        const dates = range(1, 12).map(i => date(2000, i, 1));

        return new NativeDataExtractor(locale, options, dates, 'month').extract();
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

const weekdays_cache: { [key: string]: string[] } = {};

export function weekdays(locale: string, weekdayFormat: WeekdayFormat | Options = 'long'): string[] {
    const key = JSON.stringify({locale, weekdayFormat});
    return weekdays_cache[key] = weekdays_cache[key] || (() => {
        const options: Options = {...typeof weekdayFormat == 'string' ? {weekday: weekdayFormat} : weekdayFormat};
        if (!options.weekday) return [];

        const dates = range(1, 7).map(i => date(2000, 1, i + 2));

        return new NativeDataExtractor(locale, options, dates, 'weekday').extract();
    })();
}

export interface DataExtractor {
    extract(): string[];
}

export class BaseDataExtractor {
    constructor(protected locale: string,
                protected options: Options,
                protected dates: Date[],
                protected partType: DateTimeFormatPartTypes) {
    }
}

export class NativeDataExtractor extends BaseDataExtractor implements DataExtractor {
    extract(): string[] {
        const formatter = Formatters.create(this.locale, this.options);
        return this.dates.map(d => valueFromParts(formatter.formatToParts(d), this.partType)).map(cleanValue);
    }
}

export class RegexBuilder {
    constructor(private locale: string,
                private options: Options = defaultOptions,
                private formatted: DateTimeFormatPart[]) {
    }

    @cache
    static create(locale: string, options: string | Options = defaultOptions): RegexBuilder {
        if (typeof options == 'string') return formatBuilder(locale, options);
        if (typeof options.format == 'string') return formatBuilder(locale, options.format, options.strict);

        return new RegexBuilder(locale, options, formatData(new Date(), locale, options));
    }

    @lazy get pattern() {
        const pattern = this.formatted.map((part, index) => {
            switch (part.type) {
                case "year":
                    return `(?<year>[${(Numerals.get(this.locale).pattern)}]{${this.lengthOf(part.value)}})`;
                case "month":
                    return `(?<month>${this.monthsPattern()})`;
                case "day":
                    return `(?<day>[${(Numerals.get(this.locale).pattern)}]{1,2})`;
                case "weekday":
                    return `(?<weekday>${Weekdays.get(this.locale).pattern.toLocaleLowerCase(this.locale)})`;
                default: {
                    const chars = unique(characters(escapeCharacters(this.addExtraLiterals(part)))).join('').replace(' ', '\\s');
                    const isLast = index === this.formatted.length - 1;
                    const quantifier = isLast ? '*' : '+';
                    return `[${chars}]${quantifier}?`;
                }
            }
        }).join("");
        return atBoundaryOnly(pattern);
    }

    private lengthOf(year: string) {
        if (year.length === 2) return 2;
        if (year === '2-digit') return 2;
        return 4;
    }

    private addExtraLiterals(part: DateTimeFormatPart) {
        if (this.options.strict) return part.value;
        if (this.options.format) return part.value + (this.options.separators || boundaryDelimiters);
        return part.value + (this.options.separators || (boundaryDelimiters + extraDelimiters));
    }

    private monthsPattern(): string {
        const numericPattern = `[${(Numerals.get(this.locale).pattern)}]{1,2}`;
        const textPattern = Months.get(this.locale).pattern.toLocaleLowerCase(this.locale);
        if (this.options.month === "2-digit" || this.options.month === "numeric") return numericPattern;
        if (this.options.month === "short" || this.options.month === "long") return textPattern;
        return `(?:${numericPattern}|${textPattern})`;
    }
}

export function escapeCharacters(value: string) {
    return value.replace(/[\-]/g, '\\$&');
}

export class DateParser {
    @cache
    static create(locale: string, options: string | Options = defaultOptions) {
        const pattern = RegexBuilder.create(locale, options).pattern;
        return mappingParser(DateTimeFormatPartParser.create(NamedRegExp.create(pattern), locale),
            p => dateFrom(p, locale, typeof options === "object" ? options.factory : undefined));
    }
}

export class DateTimeFormatPartParser {
    @cache
    static create(regex: NamedRegExp, locale: string): Parser<DateTimeFormatPart[]> {
        return preProcess(mappingParser(namedRegexParser(regex), m => this.convert(m, locale)), value => this.preProcess(value, locale));
    }

    static convert(matches: NamedMatch[], locale: string): DateTimeFormatPart[] {
        return matches.map((m) => ({
            type: m.name as DateTimeFormatPartTypes,
            value: m.value.toLocaleUpperCase(locale)
        }));
    }

    static preProcess(value: string, locale: string): string {
        return value.toLocaleLowerCase(locale);
    }
}

export function dateFrom(parts: DateTimeFormatPart[],
                         locale: string,
                         factory: DateFactory = new DefaultDateFactory()): Date {
    const parser = numberParser('.', locale);
    const dayText = parts.find(p => p.type === 'day');
    if (!dayText) throw new Error("No day found");
    const day = parser.parse(dayText.value);

    const monthText = parts.find(p => p.type === 'month');
    if (!monthText) throw new Error("No month found");
    const month = Months.get(locale).parse(monthText.value);

    const yearText = parts.find(p => p.type === 'year');
    const year = yearText ? parser.parse(yearText.value) : undefined;

    const weekdayText = parts.find(p => p.type === 'weekday');
    const weekday = weekdayText ? get(() => Weekdays.get(locale).parse(weekdayText.value)) : undefined;

    return factory.create({year, month, day, weekday});
}

export class DefaultDateFactory implements DateFactory {
    create({year, month, day}: DateFactoryParts): Date {
        if (typeof year === "undefined") throw new Error("No year found");
        return date(year, month, day);
    }
}

export const defaultParserOptions: (Format | Options)[] = [
    {year: 'numeric', month: 'long', day: 'numeric', weekday: "long"},
    {year: 'numeric', month: 'short', day: 'numeric', weekday: 'short'},
    {year: 'numeric', month: 'numeric', day: 'numeric'},
    {year: 'numeric', month: 'short', day: 'numeric'},
    {year: 'numeric', month: 'long', day: 'numeric'}
];

export function parser(locale: string, options?: Format | Options): Parser<Date> {
    if (typeof options == 'string') {
        return simpleParser(locale, options);
    } else {
        return localeParser(locale, options);
    }
}

export function simpleParser(locale: string, format: Format): Parser<Date> {
    return DateParser.create(locale, format);
}

export function localeParser(locale: string, options?: Format | Options): Parser<Date> {
    if (!options) {
        return or(...defaultParserOptions.map(o => localeParser(locale, o)));
    }
    return DateParser.create(locale, options);
}

export function formatBuilder(locale: string, format: Format, strict: boolean = false): RegexBuilder {
    return new RegexBuilder(locale, {...optionsFrom(format), strict}, partsFrom(format))
}

