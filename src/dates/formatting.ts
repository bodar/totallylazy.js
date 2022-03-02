import {lazy} from "../lazy";
import {characters, NamedMatch, NamedRegExp} from "../characters";
import {flatMap, map} from "../transducers";
import {cache, caching} from "../cache";
import {array} from "../array";
import {date, DateFactory, DateFactoryParts, Datum, defaultOptions, Format, Options, Weekday} from "./core";
import {flatten, unique} from "../arrays";
import {get} from "../functions";
import {extraDelimiters, mappingParser, namedRegexParser, or, Parser, preProcess} from "../parsing";
import {Mapper} from "../collections";
import {formatData, optionsFrom, partsFrom} from "./format";
import {atBoundaryOnly, boundaryDelimiters, cleanValue} from "./functions";
import {DatumLookup, numberOf, Numerals} from "./datum";
import {weekdays} from "./extractors";
import DateTimeFormatPart = Intl.DateTimeFormatPart;
import DateTimeFormatPartTypes = Intl.DateTimeFormatPartTypes;
import {MonthsBuilder} from "./generators";

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
        const textPattern = MonthsBuilder.create(this.options).build(this.locale).pattern.toLocaleLowerCase(this.locale);
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
    static create(locale: string, options: Options) {
        const pattern = RegexBuilder.create(locale, options).pattern;
        return mappingParser(DateTimeFormatPartParser.create(NamedRegExp.create(pattern), locale),
            p => dateFrom(p, locale, options));
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
                         options: Options): Date {
    const parser = numberParser('.', locale);
    const dayText = parts.find(p => p.type === 'day');
    if (!dayText) throw new Error("No day found");
    const day = parser.parse(dayText.value);

    const monthText = parts.find(p => p.type === 'month');
    if (!monthText) throw new Error("No month found");
    const month = MonthsBuilder.create(options).build(locale).parse(monthText.value);

    const yearText = parts.find(p => p.type === 'year');
    const year = yearText ? parser.parse(yearText.value) : undefined;

    const weekdayText = parts.find(p => p.type === 'weekday');
    const weekday = weekdayText ? get(() => Weekdays.get(locale).parse(weekdayText.value)) : undefined;

    return (options.factory ?? new DefaultDateFactory()).create({year, month, day, weekday});
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
    switch (typeof options){
        case "string": return DateParser.create(locale, {format: options});
        case "object": return DateParser.create(locale, options);
        default: return or(...defaultParserOptions.map(o => parser(locale, o)));
    }
}


export function formatBuilder(locale: string, format: Format, strict: boolean = false): RegexBuilder {
    return new RegexBuilder(locale, {...optionsFrom(format), strict}, partsFrom(format))
}

