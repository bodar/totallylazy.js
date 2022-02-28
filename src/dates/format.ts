import {Format, Options} from "./core";
import {array} from "../array";
import {map} from "../transducers";
import {isNamedMatch, NamedRegExp} from "../characters";
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