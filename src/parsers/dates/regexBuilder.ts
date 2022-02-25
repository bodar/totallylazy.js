import {defaultOptions, Format, Options} from "./core";
import {cache} from "../../cache";
import {lazy} from "../../lazy";
import {atBoundaryOnly, boundaryDelimiters, extraDelimiters} from "../parsing";
import {unique} from "../../arrays";
import {characters} from "../../characters";
import {Formatters, Months, Weekdays} from "./formatters";
import {digits} from "../numerals";
import {escapeCharacters} from "./escapeCharacters";
import {optionsFrom} from "./optionsFrom";
import {partsFrom} from "./partsFrom";
import DateTimeFormatPart = Intl.DateTimeFormatPart;

export function formatData(value: Date, locale: string, options: Options = defaultOptions): DateTimeFormatPart[] {
    const formatter = Formatters.create(locale, options);
    return formatter.formatToParts(value);
}

export function formatBuilder(locale: string, format: Format, strict: boolean = false): RegexBuilder {
    return new RegexBuilder(locale, {...optionsFrom(format), strict}, partsFrom(format))
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