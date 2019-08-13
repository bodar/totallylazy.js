import {cache, lazy} from "../lazy";
import {unique} from "../arrays";
import {characters, isNamedMatch, NamedMatch, NamedRegExp} from "../characters";
import {date, defaultOptions, formatData, hasNativeFormatToParts, Months, Options, Weekdays,} from "./index";
import {BaseParser, MappingParser, Parser, parsers} from "../parsing";
import DateTimeFormatPart = Intl.DateTimeFormatPart;
import DateTimeFormatPartTypes = Intl.DateTimeFormatPartTypes;
import {array} from "../collections";
import {map} from "../transducers";

export function parse(value: string, locale?: string, options?: string | Options, native = hasNativeFormatToParts): Date {
    return parser(locale, options, native).parse(value);
}

export class RegexBuilder {
    constructor(private locale: string,
                private options: Options = defaultOptions,
                private formatted: DateTimeFormatPart[]) {
    }

    @cache
    static create(locale: string = 'default', options: string | Options = defaultOptions, native = hasNativeFormatToParts): RegexBuilder {
        if (typeof options == 'string') {
            return formatBuilder(locale, options);
        } else {
            return new RegexBuilder(locale, options, formatData(new Date(), locale, options, native));
        }
    }

    @lazy get months(): Months {
        return Months.get(this.locale);
    }

    @lazy get weekdays(): Weekdays {
        return Weekdays.get(this.locale);
    }

    @lazy get regexParser(): Parser<Date> {
        return new MappingParser(new DateTimeFormatPartParser(NamedRegExp.create(this.buildPattern()), this.locale), p => dateFrom(p, this.locale));
    }

    buildPattern() {
        return this.formatted.map(part => {
            switch (part.type) {
                case "year":
                    return '(?<year>\\d{4})';
                case "month":
                    return `(?<month>(?:\\d{1,2}|${this.months.pattern.toLocaleLowerCase(this.locale)}))`;
                case "day":
                    return '(?<day>\\d{1,2})';
                case "weekday":
                    return `(?<weekday>${this.weekdays.pattern.toLocaleLowerCase(this.locale)})`;
                default: {
                    const chars = unique(characters(RegexBuilder.ensureLiteralsAlwaysContainSpace(part))).join('').replace(' ', '\\s');
                    return `[${chars}]+?`;
                }
            }
        }).join("");
    }

    private static ensureLiteralsAlwaysContainSpace(part: DateTimeFormatPart) {
        return part.value + ' ';
    }
}

export class DateTimeFormatPartParser extends BaseParser<DateTimeFormatPart[]> {
    convert(matches: NamedMatch[]) {
        return matches.map((m) => ({
            type: m.name as DateTimeFormatPartTypes,
            value: m.value.toLocaleUpperCase(this.locale)
        }));
    }

    preProcess(value: string): string {
        return value.toLocaleLowerCase(this.locale);
    }
}

export function dateFrom(parts: DateTimeFormatPart[], locale?: string): Date {
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

export function partsFrom(format: string): DateTimeFormatPart[] {
    return array(formatRegex.iterate(format), map(matchOrNot => {
        if(isNamedMatch(matchOrNot)) {
            const [match] = matchOrNot.filter(m => Boolean(m.value));
            const type = match.name as DateTimeFormatPartTypes;
            const value = formatFrom(type, match.value.length);
            return {type, value};
        } else {
            return {type: "literal", value: matchOrNot};
        }
    }));
}

export function optionsFrom(formatOrParts: string | DateTimeFormatPart[]): Options {
    const parts = typeof formatOrParts === "string" ? partsFrom(formatOrParts) : formatOrParts;
    const keys = ['year', 'month', 'day', 'weekday'];
    return parts.filter(p => keys.indexOf(p.type) != -1).reduce((a, p) => {
        a[p.type] = p.value;
        return a;
    }, {} as any);
}

export function formatBuilder(locale: string, format: string): RegexBuilder {
    const parts = partsFrom(format);

    return new RegexBuilder(locale, optionsFrom(parts), parts)
}


export const defaultParserOptions: (string | Options)[] = [
    {year: 'numeric', month: 'long', day: 'numeric', weekday: "long"},
    {year: 'numeric', month: 'short', day: 'numeric', weekday: 'short'},
    {year: 'numeric', month: 'numeric', day: 'numeric'},
    {year: 'numeric', month: 'short', day: 'numeric'},
    {year: 'numeric', month: 'long', day: 'numeric'},
    "dd MMM yyyy",
];

export function parser(locale?: string, options?: string | Options, native = hasNativeFormatToParts): Parser<Date> {
    if (typeof options == 'string') {
        return simpleParser(locale, options, native);
    } else {
        return localeParser(locale, options, native);
    }
}

export function simpleParser(locale: string = 'default', format: string, native = hasNativeFormatToParts): Parser<Date> {
    return RegexBuilder.create(locale, format, native).regexParser;
}

export function localeParser(locale?: string, options?: string | Options, native = hasNativeFormatToParts): Parser<Date> {
    if (!options) {
        return parsers(...defaultParserOptions.map(o => localeParser(locale, o, native)))
    }
    return RegexBuilder.create(locale, options, native).regexParser;
}

