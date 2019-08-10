import {flatten} from "../arrays";
import {date, MonthFormat, Options, WeekdayFormat} from "./core";
import {Formatters, hasNativeFormatToParts} from "./formatting";
import {different, replace} from "../characters";
import {Datum, DatumLookup} from "../parsing";
import DateTimeFormatPartTypes = Intl.DateTimeFormatPartTypes;
import DateTimeFormatPart = Intl.DateTimeFormatPart;

export class NumericLookup extends DatumLookup<number>{
    constructor(data: Datum<number>[]) {
        super(data);
    }

    parse(value: string): number {
        const number = parseInt(value);
        return !isNaN(number) ? number : super.parse(value);
    }
}

export type Month = Datum<number>;

export class Months extends NumericLookup {
    static formats: Options[] = [
        {month: "long"}, {month: "short"},
        {year: 'numeric', month: "long", day: 'numeric'},
        {year: 'numeric', month: 'short', day: 'numeric'}
    ];

    static cache: { [key: string]: Months } = {};

    static get(locale: string = 'default', additionalData: Month[] = []): Months {
        return Months.cache[locale] = Months.cache[locale] || Months.create(locale, additionalData);
    }

    static set(locale: string = 'default', months: Months): Months {
        return Months.cache[locale] = months;
    }

    static create(locale: string = 'default', additionalData: Month[] = []): Months {
        return new Months([...Months.generateData(locale), ...additionalData]);
    }

    static generateData(locale: string = 'default'): Month[] {
        return flatten(Months.formats.map(f => Months.dataFor(locale, f)));
    }

    static dataFor(locale: string, options: Options, native = hasNativeFormatToParts): Month[] {
        return months(locale, options, native).map((m, i) => ({name: m, value: i + 1}));
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

const months_cache: { [key: string]: string[] } = {};

export function months(locale: string = 'default', monthFormat: MonthFormat | Options = 'long', native = hasNativeFormatToParts): string[] {
    const key = JSON.stringify({locale, monthFormat, native});
    return months_cache[key] = months_cache[key] || (() => {
        const options: Options = {...typeof monthFormat == 'string' ? {month: monthFormat} : monthFormat};
        if (!options.month) return [];

        const dates = range(1, 12).map(i => date(2000, i, 1));

        if (native) return new NativeDataExtractor(locale, options, dates, 'month').extract();
        return new FromFormatStringMonthExtractor(locale, options, dates).extract();
    })();
}


export type Weekday = Datum<number>;

export class Weekdays extends NumericLookup {
    static formats: Options[] = [
        {weekday: "long"}, {weekday: "short"},
        {year: 'numeric', month: "numeric", day: 'numeric', weekday: 'long'},
        {year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short'}
    ];
    static cache: { [key: string]: Weekdays } = {};

    static get(locale: string = 'default', additionalData: Weekday[] = []): Weekdays {
        return Weekdays.cache[locale] = Weekdays.cache[locale] || Weekdays.create(locale, additionalData);
    }

    static set(locale: string = 'default', weekdays: Weekdays): Weekdays {
        return Weekdays.cache[locale] = weekdays;
    }

    static create(locale: string = 'default', additionalData: Weekday[] = []): Weekdays {
        return new Weekdays([...Weekdays.generateData(locale), ...additionalData]);
    }

    static generateData(locale: string = 'default'): Weekday[] {
        return flatten(Weekdays.formats.map(f => Weekdays.dataFor(locale, f)));
    }

    static dataFor(locale: string, options: Options, native = hasNativeFormatToParts): Weekday[] {
        return weekdays(locale, options, native).map((m, i) => ({name: m, value: i + 1}));
    }
}

const weekdays_cache: { [key: string]: string[] } = {};

export function weekdays(locale: string = 'default', weekdayFormat: WeekdayFormat | Options = 'long', native = hasNativeFormatToParts): string[] {
    const key = JSON.stringify({locale, weekdayFormat, native});
    return weekdays_cache[key] = weekdays_cache[key] || (() => {
        const options: Options = {...typeof weekdayFormat == 'string' ? {weekday: weekdayFormat} : weekdayFormat};
        if (!options.weekday) return [];

        const dates = range(1, 7).map(i => date(2000, 1, i + 2));

        if (native) return new NativeDataExtractor(locale, options, dates, 'weekday').extract();
        return new FromFormatStringWeekdayExtractor(locale, options, dates).extract();
    })();
}

export function exactFormat(locale: string, options: Options, dates: Date[]): string[] {
    const formatter = Formatters.create(locale, options);
    return dates.map(d => formatter.format(d));
}

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

export function valueFromParts(parts: DateTimeFormatPart[], partType: Intl.DateTimeFormatPartTypes) {
    return parts.filter(p => p.type === partType).map(p => p.value).join('');
}

export class NativeDataExtractor extends BaseDataExtractor implements DataExtractor {
    extract(): string[] {
        const formatter = Formatters.create(this.locale, this.options);
        return this.dates.map(d => valueFromParts(formatter.formatToParts(d), this.partType));
    }
}

export abstract class FromFormatStringDataExtractor extends BaseDataExtractor implements DataExtractor {
    extract(): string[] {
        const exact = Object.keys(this.options).length == 1;
        const fullFormats = exactFormat(this.locale, this.options, this.dates);
        if (exact) return fullFormats;
        const simpleFormats = exactFormat(this.locale, {[this.partType]: (this.options as any)[this.partType]}, this.dates);
        const diffs = this.diff(fullFormats);
        const result = [];
        for (let i = 0; i < simpleFormats.length; i++) {
            const full = fullFormats[i];
            const simple = simpleFormats[i];
            const diff = diffs[i];
            result.push(full.indexOf(simple) != -1 && simple.length > diff.length && isNaN(parseInt(diff)) ? simple : diff);
        }

        return result;
    }

    diff(data: string[]): string[] {
        return different(data);
    }
}

export class FromFormatStringMonthExtractor extends FromFormatStringDataExtractor {
    constructor(locale: string, options: Options, dates: Date[]) {
        super(locale, options, dates, 'month');
    }

    diff(data: string[]): string[] {
        if (!this.options.weekday) return super.diff(data);
        const result: string[] = [];
        const days = weekdays(this.locale, this.options, false);
        const weekday = days[this.day(this.dates[8])];
        for (let i = 0; i < data.length; i++) {
            // the characters for year,month,day are also the same for Saturday,Sunday,Monday so we temp replace them
            const format = this.replaceYearMonthDay(data[i]);
            // then make all the weekdays the same so only the months are different
            const replaced = format.replace(this.weekday(days, i), weekday);
            // then restore the original year month day symbols afterwards
            result[i] = this.restoreYearMonthDay(replaced);
        }
        return super.diff(result);
    }

    private weekday(days: string[], i: number) {
        return days[this.day(this.dates[i])];
    }

    static readonly replaceYMD = /(\d)([年月日])/g;

    private replaceYearMonthDay(value: string) {
        return replace(FromFormatStringMonthExtractor.replaceYMD, value, matcher => {
            const number = matcher[1];
            const delimiter = matcher[2];
            if (delimiter === '年') return `${number}year`;
            if (delimiter === '月') return `${number}month`;
            if (delimiter === '日') return `${number}day`;
            throw new Error(`Unknown delimiter ${delimiter}`)
        });
    }

    static readonly restoreYMD = /(year|month|day)/g;

    private restoreYearMonthDay(value: string) {
        return replace(FromFormatStringMonthExtractor.restoreYMD, value, matcher => {
            const delimiter = matcher[1];
            if (delimiter === 'year') return '年';
            if (delimiter === 'month') return '月';
            if (delimiter === 'day') return '日';
            throw new Error(`Unknown delimiter ${delimiter}`)
        });
    }

    private day(date: Date) {
        const day = date.getUTCDay();
        if (day == 0) return 6;
        return day - 1;
    }
}

export class FromFormatStringWeekdayExtractor extends FromFormatStringDataExtractor {
    constructor(locale: string, options: Options, dates: Date[]) {
        super(locale, options, dates, 'weekday');
    }

    diff(data: string[]): string[] {
        if (!this.options.day) return super.diff(data);
        const result: string[] = [];
        const day = this.dates[0].getUTCDate().toString();
        for (let i = 0; i < data.length; i++) {
            const f = data[i];
            const r = f.replace(this.dates[i].getUTCDate().toString(), day);
            result[i] = r;
        }
        return super.diff(result);
    }
}

