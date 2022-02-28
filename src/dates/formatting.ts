import {lazy} from "../lazy";
import {
    characters,
    different,
    isNamedMatch,
    NamedMatch,
    NamedRegExp,
    removeUnicodeMarkers,
    replace
} from "../characters";
import {flatMap, map, zip} from "../transducers";
import {cache, caching} from "../cache";
import {array} from "../array";
import {
    date,
    DateFactory,
    DateFactoryParts,
    defaultOptions,
    Format,
    hasNativeToParts,
    Month,
    MonthFormat,
    Options,
    Weekday,
    WeekdayFormat
} from "./core";
import {flatten, unique} from "../arrays";
import {get} from "../functions";
import {extraDelimiters, mappingParser, namedRegexParser, or, Parser, preProcess} from "../parsing";
import {DEFAULT_COMPARATOR, PrefixTree} from "../trie";
import {PreferredCurrencies} from "../money/preferred-currencies";
import {Comparator, Mapper} from "../collections";
import {DateFormatter, dateTimeFormat, optionsFrom, partsFrom, StringDateFormatter} from "./format";
import DateTimeFormatPart = Intl.DateTimeFormatPart;
import DateTimeFormat = Intl.DateTimeFormat;
import DateTimeFormatPartTypes = Intl.DateTimeFormatPartTypes;

export class Formatters {
    @cache
    static create(locale: string , options: string | Options = defaultOptions): DateFormatter {
        if (typeof options === "string") return new SimpleFormat(locale, options);
        if (typeof options.format === "string") return new SimpleFormat(locale, options.format);
        return new ImprovedDateTimeFormat(locale, options);
    }
}

export class ImprovedDateTimeFormat implements DateFormatter {
    constructor(private locale: string, private options: Options, private delegate: DateTimeFormat = ImprovedDateTimeFormat.create(locale, options)) {
    }

    private static create(locale: string, options: Options) {
        // Detect IE 11 bug
        const clone = {...options};
        const keys = Object.keys(clone).length;
        const result = dateTimeFormat(locale, clone);
        if (Object.keys(clone).length != keys) throw new Error(`Unsupported DateTimeFormat options provided: ${JSON.stringify(options)}`);
        return result;
    }

    format(date?: Date | number): string {
        return removeUnicodeMarkers(this.delegate.format(date));
    }

    // Slightly older versions of Safari implement the method but return an empty array!
    @cache
    static isNativelySupported(locale: string , options: Options = defaultOptions): boolean {
        const formatter = dateTimeFormat(locale, options);
        return typeof formatter.formatToParts == 'function' && formatter.formatToParts(new Date()).length > 0;
    }

    formatToParts(date: Date | number = new Date()): Intl.DateTimeFormatPart[] {
        if (ImprovedDateTimeFormat.isNativelySupported(this.locale, this.options)) {
            return this.delegate.formatToParts(date);
        } else {
            return DateParts.create(this.locale, this.options).toParts(typeof date === "number" ? new Date(date) : date);
        }
    }
}

export function format(value: Date, locale: string, options: Format | Options = defaultOptions): string {
    if(value == undefined) throw new Error("Date format requires a value");
    return Formatters.create(locale, options).format(value);
}

export interface Datum<V> {
    name: string;
    value: V;
}

export class DatumLookup<V> {
    private readonly prefixTree: PrefixTree<Datum<V>[]>;

    constructor(private readonly data: Datum<V>[], comparator: Comparator<string> = DEFAULT_COMPARATOR) {
        this.prefixTree = this.data.reduce((t, m) => {
            const data = t.lookup(m.name) || [];
            data.push(m);
            return t.insert(m.name, data);
        }, new PrefixTree<Datum<V>[]>(undefined, comparator));
    }

    parse(value: string, strategy: MatchStrategy<V> = uniqueMatch): V {
        const match = strategy(this.prefixTree, value);
        if (typeof match === "undefined") throw new Error(`${this.constructor.name} - Unable to parse: ${value}`);
        return match;
    }

    get pattern(): string {
        return `[${this.characters.join('')}]{1,${this.max}}`;
    }

    get max(): number {
        return this.data.reduce((max, l) => {
            const length = characters(l.name).length;
            return Math.max(max, length);
        }, Number.MIN_VALUE);
    }

    get characters(): string[] {
        return unique(flatten(this.data.map(d => d.name).map(characters))).sort();
    }
}

export type MatchStrategy<V> = (prefixTree: PrefixTree<Datum<V>[]>, value: string) => V | undefined;

export function uniqueMatch<V>(prefixTree: PrefixTree<Datum<V>[]>, value: string): V | undefined {
    const matches = flatten(prefixTree.match(value));
    const data = unique(matches.map(d => d.value));
    if (data.length != 1) return undefined;
    return data[0];
}

export function prefer<V>(value: undefined): undefined;
export function prefer<V>(...values: V[]): MatchStrategy<V>;
export function prefer<V>(...values: V[]): MatchStrategy<V> | undefined {
    if (values.filter(Boolean).length === 0) return undefined;
    return (prefixTree: PrefixTree<Datum<V>[]>, value: string) => {
        const matches = prefixTree.lookup(value) || [];
        const data = unique(matches.map(d => d.value));
        if (data.length === 0) return;
        if (data.length === 1) return data[0];
        return data.find(m => values.indexOf(m) !== -1);
    };
}

function localeParts(locale: string): string[] {
    if (!locale) return [];
    return locale.split(/[-_]/).filter(Boolean);
}

export function infer(locale: string): MatchStrategy<string> {
    const [, country] = localeParts(locale);
    const preferred = PreferredCurrencies.for(country);

    return (prefixTree: PrefixTree<Datum<string>[]>, value: string) => {
        const matches = prefixTree.lookup(value) || [];
        const allCodes = unique(matches.map(d => d.value));
        if (allCodes.length === 0) return;
        if (allCodes.length === 1) return allCodes[0];

        const bestMatch = allCodes.filter(iso => iso.startsWith(country));
        if (bestMatch.length === 1) return bestMatch[0];

        return allCodes.find(m => preferred.indexOf(m) !== -1);
    };
}

export const boundaryDelimiters = ',.';
const trailingDelimiters = new RegExp(`[${boundaryDelimiters}]$`);

export function cleanValue(value: string): string {
    return value.replace(trailingDelimiters, '');
}

export function atBoundaryOnly(pattern: string): string {
    return `(?:^|\\s)${pattern}(?=[\\s${boundaryDelimiters}]|$)`;
}

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

    format(value: number): string {
        return numberFormatter(this.locale).format(value);
    }
}

export const numberFormatter = caching((locale: string) => new Intl.NumberFormat(locale, {useGrouping: false}));
export const digits = caching((locale: string) => {
    const characters = Numerals.get(locale).characters.join('');
    if (characters === '0123456789') return '\\d';
    return `\\d${characters}`;
});

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
    const d = digits(locale);
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

    static dataFor(locale: string, options: Options, native = hasNativeToParts): MonthDatum[] {
        return months(locale, options, native).map((m, i) => ({name: m, value: i + 1}));
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

export function months(locale: string, monthFormat: MonthFormat | Options = 'long', native = hasNativeToParts): string[] {
    const key = JSON.stringify({locale, monthFormat, native});
    return months_cache[key] = months_cache[key] || (() => {
        const options: Options = {...typeof monthFormat == 'string' ? {month: monthFormat} : monthFormat};
        if (!options.month) return [];

        const dates = range(1, 12).map(i => date(2000, i, 1));

        if (native) return new NativeDataExtractor(locale, options, dates, 'month').extract().map(cleanValue);
        return new FromFormatStringMonthExtractor(locale, options, dates).extract().map(cleanValue);
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

    static dataFor(locale: string, options: Options, native = hasNativeToParts): WeekdayDatum[] {
        return weekdays(locale, options, native).map((m, i) => ({name: m, value: i + 1}));
    }
}

const weekdays_cache: { [key: string]: string[] } = {};

export function weekdays(locale: string, weekdayFormat: WeekdayFormat | Options = 'long', native = hasNativeToParts): string[] {
    const key = JSON.stringify({locale, weekdayFormat, native});
    return weekdays_cache[key] = weekdays_cache[key] || (() => {
        const options: Options = {...typeof weekdayFormat == 'string' ? {weekday: weekdayFormat} : weekdayFormat};
        if (!options.weekday) return [];

        const dates = range(1, 7).map(i => date(2000, 1, i + 2));

        if (native) return new NativeDataExtractor(locale, options, dates, 'weekday').extract().map(cleanValue);
        return new FromFormatStringWeekdayExtractor(locale, options, dates).extract().map(cleanValue);
    })();
}

export function exactFormat(locale: string, options: Options, dates: Date[]): string[] {
    const formatter = Formatters.create(locale, options);
    return dates.map(d => formatter.format(d));
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

export function valueFromParts(parts: DateTimeFormatPart[], partType: Intl.DateTimeFormatPartTypes) {
    return parts.filter(p => p.type === partType).map(p => p.value).join('');
}

export class NativeDataExtractor extends BaseDataExtractor implements DataExtractor {
    extract(): string[] {
        const formatter = Formatters.create(this.locale, this.options);
        return this.dates.map(d => valueFromParts(formatter.formatToParts(d), this.partType));
    }
}

export abstract class FromFormatStringDataExtractor extends BaseDataExtractor implements DataExtractor {
    extract(): string[] {
        const exact = Object.keys(this.options).length == 1;
        const fullFormats = exactFormat(this.locale, this.options, this.dates);
        if (exact) return fullFormats;
        const simpleFormats = exactFormat(this.locale, {[this.partType]: (this.options as any)[this.partType]} as any, this.dates);
        const diffs = this.diff(fullFormats);
        const result = [];
        for (let i = 0; i < simpleFormats.length; i++) {
            const full = fullFormats[i];
            const simple = simpleFormats[i];
            const diff = diffs[i];
            result.push(full.indexOf(simple) != -1 && simple.length > diff.length && isNaN(parseInt(diff)) ? simple : diff);
        }

        return result;
    }

    diff(data: string[]): string[] {
        return different(data);
    }
}

export class FromFormatStringMonthExtractor extends FromFormatStringDataExtractor {
    constructor(locale: string, options: Options, dates: Date[]) {
        super(locale, options, dates, 'month');
    }

    diff(data: string[]): string[] {
        if (!this.options.weekday) return super.diff(data);
        const result: string[] = [];
        const days = weekdays(this.locale, this.options, false);
        const weekday = days[this.day(this.dates[8])];
        for (let i = 0; i < data.length; i++) {
            // the characters for year,month,day are also the same for Saturday,Sunday,Monday so we temp replace them
            const format = this.replaceYearMonthDay(data[i]);
            // then make all the weekdays the same so only the months are different
            const replaced = format.replace(this.weekday(days, i), weekday);
            // then restore the original year month day symbols afterwards
            result[i] = this.restoreYearMonthDay(replaced);
        }
        return super.diff(result);
    }

    private weekday(days: string[], i: number) {
        return days[this.day(this.dates[i])];
    }

    static readonly replaceYMD = /(\d)([年月日])/g;

    private replaceYearMonthDay(value: string) {
        return replace(FromFormatStringMonthExtractor.replaceYMD, value, matcher => {
            const number = matcher[1];
            const delimiter = matcher[2];
            if (delimiter === '年') return `${number}year`;
            if (delimiter === '月') return `${number}month`;
            if (delimiter === '日') return `${number}day`;
            throw new Error(`Unknown delimiter ${delimiter}`)
        });
    }

    static readonly restoreYMD = /(year|month|day)/g;

    private restoreYearMonthDay(value: string) {
        return replace(FromFormatStringMonthExtractor.restoreYMD, value, matcher => {
            const delimiter = matcher[1];
            if (delimiter === 'year') return '年';
            if (delimiter === 'month') return '月';
            if (delimiter === 'day') return '日';
            throw new Error(`Unknown delimiter ${delimiter}`)
        });
    }

    private day(date: Date): number {
        const day = date.getUTCDay();
        if (day == 0) return 6;
        return day - 1;
    }
}

export class FromFormatStringWeekdayExtractor extends FromFormatStringDataExtractor {
    constructor(locale: string, options: Options, dates: Date[]) {
        super(locale, options, dates, 'weekday');
    }

    diff(data: string[]): string[] {
        if (!this.options.day) return super.diff(data);
        const result: string[] = [];
        const day = this.dates[0].getUTCDate().toString();
        for (let i = 0; i < data.length; i++) {
            const f = data[i];
            const d = this.convertToNumeral(this.dates[i].getUTCDate());
            const r = f.replace(d, day);
            result[i] = r;
        }
        return super.diff(result);
    }

    private convertToNumeral(number: number): string {
        return numberFormatter(this.locale).format(number);
    }
}

export class RegexBuilder {
    constructor(private locale: string,
                private options: Options = defaultOptions,
                private formatted: DateTimeFormatPart[]) {
    }

    @cache
    static create(locale: string, options: string | Options = defaultOptions, native = hasNativeToParts): RegexBuilder {
        if (typeof options == 'string') return formatBuilder(locale, options);
        if (typeof options.format == 'string') return formatBuilder(locale, options.format, options.strict);

        return new RegexBuilder(locale, options, formatData(new Date(), locale, options, native));
    }

    @lazy get pattern() {
        const pattern = this.formatted.map((part, index) => {
            switch (part.type) {
                case "year":
                    return `(?<year>[${digits(this.locale)}]{${this.lengthOf(part.value)}})`;
                case "month":
                    return `(?<month>${this.monthsPattern()})`;
                case "day":
                    return `(?<day>[${digits(this.locale)}]{1,2})`;
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
        const numericPattern = `[${digits(this.locale)}]{1,2}`;
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
    static create(locale: string, options: string | Options = defaultOptions, native = hasNativeToParts) {
        const pattern = RegexBuilder.create(locale, options, native).pattern;
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

export function parser(locale: string, options?: Format | Options, native = hasNativeToParts): Parser<Date> {
    if (typeof options == 'string') {
        return simpleParser(locale, options, native);
    } else {
        return localeParser(locale, options, native);
    }
}

export function simpleParser(locale: string, format: Format, native = hasNativeToParts): Parser<Date> {
    return DateParser.create(locale, format, native);
}

export function localeParser(locale: string, options?: Format | Options, native = hasNativeToParts): Parser<Date> {
    if (!options) {
        return or(...defaultParserOptions.map(o => localeParser(locale, o, native)));
    }
    return DateParser.create(locale, options, native);
}

export function formatBuilder(locale: string, format: Format, strict: boolean = false): RegexBuilder {
    return new RegexBuilder(locale, {...optionsFrom(format), strict}, partsFrom(format))
}

export class SimpleFormat implements DateFormatter {
    private partsInOrder: DateTimeFormatPart[];
    private options: Options;

    constructor(private locale: string, private formatString: Format) {
        this.partsInOrder = partsFrom(formatString);
        this.options = optionsFrom(this.partsInOrder);
    }

    format(date: Date): string {
        return this.formatToParts(date).map(p => p.value).join("");
    }

    formatToParts(date: Date): Intl.DateTimeFormatPart[] {
        const partsWithValues = DateParts.create(this.locale, this.options).toParts(date);
        return this.partsInOrder.map(p => ({type: p.type, value: this.valueFor(partsWithValues, p.type, p.value)}));
    }

    private valueFor(partsWithValues: Intl.DateTimeFormatPart[], type: DateTimeFormatPartTypes, value: string): string {
        if (type === 'literal') return value;
        return valueFromParts(partsWithValues, type);
    }
}

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

    @lazy get formatter(): StringDateFormatter {
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