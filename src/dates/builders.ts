import {
    ParserBuilder,
    date,
    Month,
    Options,
    MonthFormat,
    Dependencies,
    WeekdayFormat,
    Weekday,
    WeekdayDatum, MonthDatum, LocalisedData
} from "./core";
import {Formatters, valueFromParts} from "./format";
import {cleanValue} from "./functions";
import {cache} from "../cache";
import {Months, Weekdays} from "./datum";


// No dep version
function range(start: number, end: number): number[] {
    const result = [];
    for (let i = start; i <= end; i++) {
        result.push(i);
    }
    return result;
}

export class MonthsBuilder implements ParserBuilder<Month>{
    constructor(private monthsData: LocalisedData<MonthDatum> = {}) {
    }

    static create(dependencies:Dependencies): ParserBuilder<Month> {
        const monthsData = dependencies.monthsData;
        return this._create(monthsData);
    }

    @cache private static _create(monthsData: LocalisedData<MonthDatum>  | undefined) {
        return new MonthsBuilder(monthsData);
    }

    private static formats: Options[] = [
        {month: "long"}, {month: "short"},
        {year: 'numeric', month: "long", day: 'numeric'},
        {year: 'numeric', month: 'short', day: 'numeric'},
    ];

    @cache build(locale: string): Months {
        const data = MonthsBuilder.formats.flatMap(o => this.datumFor(locale, o));
        return new Months([...this.monthsData[locale] || [], ...data], locale);
    }

    private datumFor(locale: string, options: Options): MonthDatum[] {
        return this.namesFor(locale, options).map((m, i) => ({name: m, value: i + 1}))
    }

    @cache namesFor(locale: string, options: Options): string[] {
        const dates = range(1, 12).map(i => date(2000, i, 1));
        const formatter = Formatters.create(locale, options);
        return dates.map(d => valueFromParts(formatter.formatToParts(d), "month")).map(cleanValue);
    }
}

export function months(locale: string,  monthFormat: MonthFormat | Options = 'long'): string[] {
    const options: Options = {...typeof monthFormat == 'string' ? {month: monthFormat} : monthFormat};
    return MonthsBuilder.create(options).namesFor(locale, options);
}


export class WeekdaysBuilder implements ParserBuilder<Weekday>{
    constructor(private weekdayData: LocalisedData<WeekdayDatum> = {}) {
    }

    static create(dependencies:Dependencies): ParserBuilder<Weekday> {
        const weekdaysData = dependencies.weekdaysData;
        return this._create(weekdaysData);
    }

    @cache private static _create(weekdayData: LocalisedData<WeekdayDatum> | undefined) {
        return new WeekdaysBuilder(weekdayData);
    }

    private static formats: Options[] = [
        {weekday: "long"}, {weekday: "short"},
        {year: 'numeric', month: "numeric", day: 'numeric', weekday: 'long'},
        {year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short'}
    ];

    @cache build(locale: string): Weekdays {
        const data = WeekdaysBuilder.formats.flatMap(o => this.datumFor(locale, o));
        return new Weekdays([...this.weekdayData[locale] || [], ...data]);
    }

    private datumFor(locale: string, options: Options): WeekdayDatum[] {
        return this.namesFor(locale, options).map((m, i) => ({name: m, value: i + 1}))
    }

    @cache namesFor(locale: string, options: Options): string[] {
        const dates = range(1, 7).map(i => date(2000, 1, i + 2));
        const formatter = Formatters.create(locale, options);
        return dates.map(d => valueFromParts(formatter.formatToParts(d), "weekday")).map(cleanValue);
    }
}

export function weekdays(locale: string, weekdayFormat: WeekdayFormat | Options = 'long'): string[] {
    const options: Options = {...typeof weekdayFormat == 'string' ? {weekday: weekdayFormat} : weekdayFormat};
    return WeekdaysBuilder.create(options).namesFor(locale, options);
}