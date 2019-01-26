import {PrefixTree} from "../trie";
import {flatten, unique} from "../arrays";
import {date, MonthFormat, Options, WeekdayFormat} from "./core";
import {Formatters, hasNativeFormatToParts} from "./formatting";
import {characters, different} from "../characters";
import DateTimeFormat = Intl.DateTimeFormat;
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
        const min = flatten(this.data).reduce((a,l) => Math.min(a, l.name.length), Number.MAX_VALUE);
        return `[${this.characters.join('')}]{${min},${this.prefixTree.height}}`;
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
        return months(locale, options, hasNativeFormatToParts).map((m, i) => ({name: m, number: i + 1}));
    }
}

// No dep version
function range(start:number, end:number):number[]{
    const result = [];
    for (let i = start; i <= end; i++) {
        result.push(i);
    }
    return result;
}

export function months(locale: string = 'default', monthFormat: MonthFormat | Options = 'long', native = hasNativeFormatToParts): string[] {
    const options: Options = {...typeof monthFormat == 'string' ? {month: monthFormat} : monthFormat};
    delete options.weekday;

    const dates = range(1,12).map(i => date(2000, i, 1));

    if(native) return new NativeDataExtractor(locale, options, dates, 'month').extract();
    return new FromFormatStringDataExtractor(locale, options, dates, 'month').extract();
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

export function weekdays(locale: string = 'default', weekdayFormat: WeekdayFormat | Options = 'long', native=hasNativeFormatToParts): string[] {
    const options: Options = {...typeof weekdayFormat == 'string' ? {weekday: weekdayFormat} : weekdayFormat};

    const dates = range(1,7).map(i => date(2000, 1, i + 2));

    if(native) return new NativeDataExtractor(locale, options, dates, 'weekday').extract();
    return new FromFormatStringDataExtractor(locale, options, dates, 'weekday').extract();
}

export function exactFormat(locale: string, options:Options,  dates:Date[]): string[] {
    const formatter = Formatters.create(locale, options);
    return dates.map(d => formatter.format(d));
}

export interface DataExtractor {
    extract(): string[];
}

export class BaseDataExtractor{
    constructor(protected locale:string,
                protected options:Options,
                protected dates:Date[],
                protected partType:DateTimeFormatPartTypes){
    }
}

export class NativeDataExtractor extends BaseDataExtractor implements DataExtractor {
    extract(): string[] {
        const formatter = Formatters.create(this.locale, this.options);
        return this.dates.map(d => formatter.formatToParts(d).filter(p => p.type === this.partType).map(p => p.value).join(''));
    }
}

export class FromFormatStringDataExtractor extends BaseDataExtractor implements DataExtractor {
    extract(): string[] {
        const exact = Object.keys(this.options).length == 1;
        const fullFormat = exactFormat(this.locale, this.options, this.dates);
        if(exact) return fullFormat;

        if(this.partType == "weekday"){
            // Make the day of the week the same
            const day = this.dates[0].getDate();
            for (let i = 0; i < fullFormat.length; i++) {
                const f = fullFormat[i];
                const r = f.replace(this.dates[i].getDate().toString(), day.toString());
                fullFormat[i] = r;
            }
        }

        const simpleFormat = exactFormat(this.locale, {[this.partType]: (this.options as any)[this.partType]}, this.dates);
        const diff = different(fullFormat);
        const result = [];
        for (let i = 0; i < simpleFormat.length; i++) {
            const s = simpleFormat[i];
            const d = diff[i];
            result.push(d.length >= s.length ? d : s);
        }

        return result;
    }
}

