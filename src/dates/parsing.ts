import {lazy} from "../lazy";
import {unique} from "../arrays";
import {characters, isNamedMatch, NamedMatch, NamedRegExp} from "../characters";
import {date, defaultOptions, Format, formatData, hasNativeToParts, Months, Options, Weekdays,} from "./index";
import {mappingParser, namedRegexParser, or, Parser, preProcess} from "../parsing";
import {array} from "../collections";
import {map} from "../transducers";
import {cache} from "../cache";
import DateTimeFormatPart = Intl.DateTimeFormatPart;
import DateTimeFormatPartTypes = Intl.DateTimeFormatPartTypes;

export function parse(value: string, locale: string, options?: string | Options, native = hasNativeToParts): Date {
    return parser(locale, options, native).parse(value);
}

export class RegexBuilder {
    constructor(private locale: string,
                private options: Options = defaultOptions,
                private formatted: DateTimeFormatPart[]) {
    }

    @cache
    static create(locale: string, options: string | Options = defaultOptions, native = hasNativeToParts): RegexBuilder {
        if (typeof options == 'string') {
            return formatBuilder(locale, options);
        } else {
            return new RegexBuilder(locale, options, formatData(new Date(), locale, options, native));
        }
    }

    @lazy get pattern() {
        return this.formatted.map((part, index) => {
            switch (part.type) {
                case "year":
                    return '(?<year>\\d{4})';
                case "month":
                    return `(?<month>${this.monthsPattern()})`;
                case "day":
                    return '(?<day>\\d{1,2})';
                case "weekday":
                    return `(?<weekday>${Weekdays.get(this.locale).pattern.toLocaleLowerCase(this.locale)})`;
                default: {
                    const chars = unique(characters(this.addExtraLiterals(part))).join('').replace(' ', '\\s');
                    const isLast = index === this.formatted.length - 1;
                    const quantifier = isLast ? '*' : '+';
                    return `[${chars}]${quantifier}?`;
                }
            }
        }).join("");
    }

    private addExtraLiterals(part: DateTimeFormatPart) {
        if (this.options.format) return part.value;
        return part.value + (this.options.separators || escapeCharacters(' ,.-/'));
    }

    private monthsPattern(): string {
        const numericPattern = `\\d{1,2}`;
        const textPattern = Months.get(this.locale).pattern.toLocaleLowerCase(this.locale);
        if (this.options.month === "2-digit" || this.options.month === "numeric") return numericPattern;
        if (this.options.month === "short" || this.options.month === "long") return textPattern;
        return `(?:${numericPattern}|${textPattern})`;
    }
}

export function escapeCharacters(value:string) {
    return value.replace(/[\-]/g, '\\$&');
}

export class DateParser {
    @cache
    static create(locale: string, options: string | Options = defaultOptions, native = hasNativeToParts) {
        const pattern = RegexBuilder.create(locale, options, native).pattern;
        return mappingParser(DateTimeFormatPartParser.create(NamedRegExp.create(pattern), locale), p => dateFrom(p, locale));
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

export function dateFrom(parts: DateTimeFormatPart[], locale: string): Date {
    const [year] = parts.filter(p => p.type === 'year');
    if (!year) throw new Error("No year found");
    const yyyy = Number(year.value);

    const [month] = parts.filter(p => p.type === 'month');
    if (!month) throw new Error("No month found");
    const MM = Months.get(locale).parse(month.value);

    const [day] = parts.filter(p => p.type === 'day');
    if (!day) throw new Error("No day found");
    const dd = Number(day.value);

    return date(yyyy, MM, dd);
}

export function formatFrom(type: DateTimeFormatPartTypes, length: number): string {
    if (type === 'year') {
        if (length === 4) return "numeric";
        if (length === 2) return "2-digit";
    }
    if (type === 'month') {
        if (length === 4) return "long";
        if (length === 3) return "short";
        if (length === 2) return "2-digit";
        if (length === 1) return "numeric";
    }
    if (type === 'day') {
        if (length === 2) return "2-digit";
        if (length === 1) return "numeric";
    }
    if (type === 'weekday') {
        if (length === 4) return "long";
        if (length === 3) return "short";
    }
    throw new Error(`Illegal Argument: ${type} ${length}`);
}

export const formatRegex = NamedRegExp.create('(?:(?<year>y+)|(?<month>M+)|(?<day>d+)|(?<weekday>E+))', 'g');

export function partsFrom(format: Format): DateTimeFormatPart[] {
    return array(formatRegex.iterate(format), map(matchOrNot => {
        if (isNamedMatch(matchOrNot)) {
            const [match] = matchOrNot.filter(m => Boolean(m.value));
            const type = match.name as DateTimeFormatPartTypes;
            const value = formatFrom(type, match.value.length);
            return {type, value};
        } else {
            return {type: "literal", value: matchOrNot};
        }
    }));
}

export function optionsFrom(formatOrParts: Format | DateTimeFormatPart[]): Options {
    const parts = typeof formatOrParts === "string" ? partsFrom(formatOrParts) : formatOrParts;
    const keys = ['year', 'month', 'day', 'weekday'];
    return parts.filter(p => keys.indexOf(p.type) != -1).reduce((a, p) => {
        a[p.type] = p.value;
        return a;
    }, typeof formatOrParts === "string" ? {format: formatOrParts} : {} as any);
}

export function formatBuilder(locale: string, format: Format): RegexBuilder {
    return new RegexBuilder(locale, optionsFrom(format), partsFrom(format))
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

