import {PrefixTree} from "../trie";
import {flatten, unique} from "../arrays";
import {date, MonthFormat, Options, WeekdayFormat} from "./core";
import {Formatters, hasNativeFormatToParts} from "./formatting";
import {characters, different, replace} from "../characters";
import DateTimeFormatPartTypes = Intl.DateTimeFormatPartTypes;

export interface Datum {
    number: number;
    name: string;
}

export class DatumLookup<T extends Datum = Datum> {
    private readonly prefixTree: PrefixTree<number>;

    constructor(public locale: string, private data: T[][]) {
        this.prefixTree = flatten(this.data).reduce((t, m) => {
            return t.insert(m.name.toLocaleLowerCase(this.locale), m.number);
        }, new PrefixTree<number>());
    }

    parse(value: string): T {
        const number = parseInt(value);
        if (!isNaN(number)) return this.get(number);

        const data = unique(this.prefixTree.match(value.toLocaleLowerCase(this.locale)));
        if (data.length != 1) throw new Error(`${this.constructor.name} - Unable to parse: ${value} matched : ${JSON.stringify(data)}`);
        const [datum] = data;
        return this.get(datum);
    }

    get(number: number): T {
        const result = this.data[0][number - 1];
        if (!result) throw new Error(`${this.constructor.name} - Illegal argument: number was out of range : ${number}`);
        return result;
    }

    get pattern(): string {
        const min = flatten(this.data).reduce((a, l) => Math.min(a, l.name.length), Number.MAX_VALUE);
        return `[${this.characters.join('')}]{${min},${this.prefixTree.height}}`;
    }

    get characters(): string[] {
        return unique(flatten(flatten(this.data).map(d => d.name).map(characters)));
    }
}

export type Month = Datum;

export class Months extends DatumLookup<Month> {
    static formats: Options[] = [
        {month: "long"}, {month: "short"},
        {year: 'numeric', month: "long", day: 'numeric'},
        {year: 'numeric', month: 'short', day: '2-digit'}
    ];

    static cache: { [key: string]: Months } = {};

    static get(locale: string = 'default', additionalData: Month[] = []): Months {
        return Months.cache[locale] = Months.cache[locale] || Months.create(locale, additionalData);
    }

    static set(locale: string = 'default', months: Months): Months {
        return Months.cache[locale] = months;
    }

    static create(locale: string = 'default', additionalData: Month[] = []): Months {
        return new Months(locale, [...Months.generateData(locale), additionalData]);
    }

    static generateData(locale: string = 'default'): Month[][] {
        return Months.formats.map(f => Months.dataFor(locale, f));
    }

    static dataFor(locale: string, options: Options, native = hasNativeFormatToParts): Month[] {
        return months(locale, options, native).map((m, i) => ({name: m, number: i + 1}));
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

        const dates = range(1, 12).map(i => date(2000, i, 1));

        if (native) return new NativeDataExtractor(locale, options, dates, 'month').extract();
        return new FromFormatStringMonthExtractor(locale, options, dates).extract();
    })();
}


export type Weekday = Datum;

export class Weekdays extends DatumLookup<Weekday> {
    static formats: Options[] = [
        {weekday: "long"}, {weekday: "short"},
        {year: 'numeric', month: "numeric", weekday: 'long'},
        {year: 'numeric', month: 'numeric', weekday: 'short'}
    ];
    static cache: { [key: string]: Weekdays } = {};

    static get(locale: string = 'default', additionalData: Weekday[] = []): Weekdays {
        return Weekdays.cache[locale] = Weekdays.cache[locale] || Weekdays.create(locale, additionalData);
    }

    static set(locale: string = 'default', weekdays: Weekdays): Weekdays {
        return Weekdays.cache[locale] = weekdays;
    }

    static create(locale: string = 'default', additionalData: Weekday[] = []): Weekdays {
        return new Weekdays(locale, [...Weekdays.generateData(locale), additionalData]);
    }

    static generateData(locale: string = 'default'): Weekday[][] {
        return Weekdays.formats.map(f => Weekdays.dataFor(locale, f));
    }

    static dataFor(locale: string, options: Options, native = hasNativeFormatToParts): Weekday[] {
        return weekdays(locale, options, native).map((m, i) => ({name: m, number: i + 1}));
    }
}

const weekdays_cache: { [key: string]: string[] } = {};

export function weekdays(locale: string = 'default', weekdayFormat: WeekdayFormat | Options = 'long', native = hasNativeFormatToParts): string[] {
    const key = JSON.stringify({locale, weekdayFormat, native});
    return weekdays_cache[key] = weekdays_cache[key] || (() => {
        const options: Options = {...typeof weekdayFormat == 'string' ? {weekday: weekdayFormat} : weekdayFormat};

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

export class NativeDataExtractor extends BaseDataExtractor implements DataExtractor {
    extract(): string[] {
        const formatter = Formatters.create(this.locale, this.options);
        return this.dates.map(d => formatter.formatToParts(d).filter(p => p.type === this.partType).map(p => p.value).join(''));
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
            if(delimiter === '年') return `${number}year`;
            if(delimiter === '月') return `${number}month`;
            if(delimiter === '日') return `${number}day`;
            throw new Error(`Unknown delimiter ${delimiter}`)
        });
    }

    static readonly restoreYMD = /(year|month|day)/g;
    private restoreYearMonthDay(value: string) {
        return replace(FromFormatStringMonthExtractor.restoreYMD, value, matcher => {
            const delimiter = matcher[1];
            if(delimiter === 'year') return '年';
            if(delimiter === 'month') return '月';
            if(delimiter === 'day') return '日';
            throw new Error(`Unknown delimiter ${delimiter}`)
        });
    }

    private day(date: Date) {
        const day = date.getDay();
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
        const day = this.dates[0].getDate().toString();
        for (let i = 0; i < data.length; i++) {
            const f = data[i];
            const r = f.replace(this.dates[i].getDate().toString(), day);
            result[i] = r;
        }
        return super.diff(result);
    }
}

