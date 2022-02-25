import {cache} from "../../cache";
import {NamedMatch, NamedRegExp} from "../../characters";
import {Parser} from "../parser";
import {mappingParser} from "../mappingParser";
import {namedRegexParser} from "../namedRegexParser";
import DateTimeFormatPart = Intl.DateTimeFormatPart;
import DateTimeFormatPartTypes = Intl.DateTimeFormatPartTypes;
import { preProcess } from '../preProcessor';

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