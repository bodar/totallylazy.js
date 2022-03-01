import {Options} from "./core";
import {Formatters, valueFromParts} from "./format";
import {cleanValue} from "./functions";
import DateTimeFormatPartTypes = Intl.DateTimeFormatPartTypes;

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