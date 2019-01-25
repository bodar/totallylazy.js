import {PrefixTree} from "../trie";
import {flatten, unique} from "../arrays";
import {date, MonthFormat, Options, WeekdayFormat} from "./core";
import {Formatters, hasNativeFormatToParts} from "./formatting";
import {characters, different} from "../characters";

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

        const months = unique(this.prefixTree.match(value.toLocaleLowerCase(this.locale)));
        if (months.length != 1) throw new Error(`${this.constructor.name} - Unable to parse: ${value} matched : ${JSON.stringify(months)}`);
        const [month] = months;
        return this.get(month);
    }

    get(number: number): T {
        const result = this.data[0][number - 1];
        if(!result) throw new Error(`${this.constructor.name} - Illegal argument: number was out of range : ${number}`);
        return result;
    }

    get pattern(): string {
        return `[${this.characters.join('')}]{1,${this.prefixTree.height}}`;
    }

    get characters(): string[] {
        return unique(flatten(flatten(this.data).map(d => d.name).map(characters)));
    }
}

export type Month = Datum;

export class Months extends DatumLookup<Month>{
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

    static dataFor(locale: string, options:Options): Month[] {
        return months(locale, options).map((m, i) => ({name: m, number: i + 1}));
    }
}

export function months(locale?: string, monthFormat: MonthFormat | Options = 'long'): string[] {
    const options: Options = {...typeof monthFormat == 'string' ? {month: monthFormat} : monthFormat};
    delete options.weekday;
    const result = [];

    const formatter = Formatters.create(locale, options);
    const exact = Object.keys(options).length == 1 || hasNativeFormatToParts;

    for (let i = 1; i <= 12; i++) {
        const d = date(2000, i, 1);
        if(hasNativeFormatToParts) {
            result.push(formatter.formatToParts(d).filter(p => p.type === 'month').map(p => p.value).join(""));
        } else {
            result.push(formatter.format(d));
        }
    }

    return exact ? result : different(result);
}

export type Weekday = Datum;

export class Weekdays extends DatumLookup<Weekday>{
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

    static dataFor(locale: string, options:Options): Weekday[] {
        return weekdays(locale, options).map((m, i) => ({name: m, number: i + 1}));
    }
}

export function weekdays(locale?: string, weekdayFormat: WeekdayFormat | Options = 'long'): string[] {
    const options: Options = {...typeof weekdayFormat == 'string' ? {weekday: weekdayFormat} : weekdayFormat};
    delete options.day;
    const result = [];

    const formatter = Formatters.create(locale, options);
    const exact = Object.keys(options).length == 1 || hasNativeFormatToParts;

    for (let i = 1; i <= 7; i++) {
        const day = date(2000, 1, i + 2);
        if(hasNativeFormatToParts) {
            result.push(formatter.formatToParts(day).filter(p => p.type === 'weekday').map(p => p.value).join(""));
        } else {
            result.push(formatter.format(day));
        }
    }

    return exact ? result : different(result);
}

