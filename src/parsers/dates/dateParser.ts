import {cache} from "../../cache";
import {defaultOptions, Format, Options} from "./core";
import {RegexBuilder} from "./regexBuilder";
import {mappingParser} from "../mappingParser";
import {NamedRegExp} from "../../characters";
import {DateTimeFormatPartParser} from "./dateTimeFormatPartParser";
import {dateFrom} from "./dateFrom";
import {Parser} from "../parser";
import {or} from "../orParser";
import {defaultParserOptions} from "./defaultParserOptions";

export class DateParser {
    @cache
    static create(locale: string, options: string | Options = defaultOptions) {
        const pattern = RegexBuilder.create(locale, options).pattern;
        return mappingParser(DateTimeFormatPartParser.create(NamedRegExp.create(pattern), locale),
            p => dateFrom(p, locale, typeof options === "object" ? options.factory : undefined));
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

export function parser(locale: string, options?: Format | Options): Parser<Date> {
    if (typeof options == 'string') {
        return simpleParser(locale, options);
    } else {
        return localeParser(locale, options);
    }
}

export function parse(value: string, locale: string, options?: string | Options): Date {
    return parser(locale, options).parse(value);
}