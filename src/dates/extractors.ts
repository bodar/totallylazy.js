import {date, Options, WeekdayFormat} from "./core";
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


// No dep version
function range(start: number, end: number): number[] {
    const result = [];
    for (let i = start; i <= end; i++) {
        result.push(i);
    }
    return result;
}

const weekdays_cache: { [key: string]: string[] } = {};

export function weekdays(locale: string, weekdayFormat: WeekdayFormat | Options = 'long'): string[] {
    const key = JSON.stringify({locale, weekdayFormat});
    return weekdays_cache[key] = weekdays_cache[key] || (() => {
        const options: Options = {...typeof weekdayFormat == 'string' ? {weekday: weekdayFormat} : weekdayFormat};
        if (!options.weekday) return [];

        const dates = range(1, 7).map(i => date(2000, 1, i + 2));

        return new NativeDataExtractor(locale, options, dates, 'weekday').extract();
    })();
}