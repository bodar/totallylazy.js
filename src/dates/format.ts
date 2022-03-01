import {defaultOptions, Format, Options} from "./core";
import {array} from "../array";
import {map} from "../transducers";
import {isNamedMatch, NamedRegExp, removeUnicodeMarkers} from "../characters";
import {cache} from "../cache";
import DateTimeFormatPart = Intl.DateTimeFormatPart;
import DateTimeFormat = Intl.DateTimeFormat;
import DateTimeFormatPartTypes = Intl.DateTimeFormatPartTypes;


export function dateTimeFormat(locale: string, options: Options) {
    return new Intl.DateTimeFormat(locale, {...options, timeZone: 'UTC'});
}

export interface StringDateFormatter {
    format(date: Date): string;
}

export interface PartsDateFormatter {
    formatToParts(date: Date): Intl.DateTimeFormatPart[];
}

export type DateFormatter = StringDateFormatter & PartsDateFormatter;

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

export class Formatters {
    @cache
    static create(locale: string, options: string | Options): DateFormatter {
        if (typeof options === "string") return new SimpleFormat(locale, options);
        if (typeof options.format === "string") return new SimpleFormat(locale, options.format);
        return new ImprovedDateTimeFormat(locale, options);
    }
}

export class ImprovedDateTimeFormat implements DateFormatter {
    constructor(private locale: string, private options: Options, private delegate: DateTimeFormat = dateTimeFormat(locale, options)) {
    }

    format(date: Date): string {
        return removeUnicodeMarkers(this.delegate.format(date));
    }

    formatToParts(date: Date): Intl.DateTimeFormatPart[] {
        return this.delegate.formatToParts(date);
    }
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
        const partsWithValues = dateTimeFormat(this.locale, this.options).formatToParts(date);
        return this.partsInOrder.map(p => ({type: p.type, value: this.valueFor(partsWithValues, p.type, p.value)}));
    }

    private valueFor(partsWithValues: Intl.DateTimeFormatPart[], type: DateTimeFormatPartTypes, value: string): string {
        if (type === 'literal') return value;
        return valueFromParts(partsWithValues, type);
    }
}

export function valueFromParts(parts: DateTimeFormatPart[], partType: Intl.DateTimeFormatPartTypes) {
    return parts.filter(p => p.type === partType).map(p => p.value).join('');
}

export function format(value: Date, locale: string, options: Format | Options = defaultOptions): string {
    if (value == undefined) throw new Error("Date format requires a value");
    return Formatters.create(locale, options).format(value);
}

export function formatData(value: Date, locale: string, options: Options = defaultOptions): DateTimeFormatPart[] {
    const formatter = Formatters.create(locale, options);
    return formatter.formatToParts(value);
}