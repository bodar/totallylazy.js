import {DEFAULT_COMPARATOR, PrefixTree} from "../trie";
import {Month, Weekday} from "./core";
import {Comparator} from "../collections";
import {cleanValue} from "./functions";
import {flatten, unique} from "../arrays";
import {characters} from "../characters";
import {get} from "../functions";
import {array} from "../array";
import {map, zip} from "../transducers";
import {lazy} from "../lazy";
import {caching} from "../cache";

export interface Datum<V> {
    name: string;
    value: V;
}

export type MatchStrategy<V> = (prefixTree: PrefixTree<Datum<V>[]>, value: string) => V | undefined;

export function uniqueMatch<V>(prefixTree: PrefixTree<Datum<V>[]>, value: string): V | undefined {
    const matches = flatten(prefixTree.match(value));
    const data = unique(matches.map(d => d.value));
    if (data.length != 1) return undefined;
    return data[0];
}

export class DatumLookup<V> {
    private readonly prefixTree: PrefixTree<Datum<V>[]>;

    constructor(private readonly data: Datum<V>[], comparator: Comparator<string> = DEFAULT_COMPARATOR) {
        this.prefixTree = this.data.reduce((t, m) => {
            const data = t.lookup(m.name) || [];
            data.push(m);
            return t.insert(m.name, data);
        }, new PrefixTree<Datum<V>[]>(undefined, comparator));
    }

    parse(value: string, strategy: MatchStrategy<V> = uniqueMatch): V {
        const match = strategy(this.prefixTree, value);
        if (typeof match === "undefined") throw new Error(`${this.constructor.name} - Unable to parse: ${value}`);
        return match;
    }

    get pattern(): string {
        return `[${this.characters.join('')}]{1,${this.max}}`;
    }

    private get max(): number {
        return this.data.reduce((max, l) => {
            const length = characters(l.name).length;
            return Math.max(max, length);
        }, Number.MIN_VALUE);
    }

    protected get characters(): string[] {
        return unique(this.data.map(d => d.name).flatMap(characters)).sort();
    }
}

export function numberOf(value: string): number {
    if (!value || value.trim().length === 0) return NaN;
    return Number(value);
}

export type Numeral = Datum<number>;

export class Numerals extends DatumLookup<number> {
    constructor(data: Datum<number>[], private locale: string) {
        super(data);
    }

    static cache: { [key: string]: Numerals } = {};

    static get(locale: string, additionalData: Numeral[] = []): Numerals {
        return Numerals.cache[locale] = Numerals.cache[locale] || Numerals.create(locale, additionalData);
    }

    static create(locale: string, additionalData: Numeral[] = []): Numerals {
        return new Numerals([...Numerals.generateData(locale), ...additionalData], locale);
    }

    static generateData(locale: string): Numeral[] {
        const digits = numberFormatter(locale).format(1234567890).replace(/[,. '٬٫]/g, '');
        return array(characters(digits), zip([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]), map(([c, d]) => ({name: c, value: d})));
    }

    parse(value: string): number {
        const number = numberOf(value);
        return !isNaN(number) ? number : super.parse(value);
    }

    @lazy get pattern(): string {
        const characters = this.characters.join('');
        if (characters === '0123456789') return '\\d';
        return `\\d${characters}`;
    }

    format(value: number): string {
        return numberFormatter(this.locale).format(value);
    }
}

export const numberFormatter = caching((locale: string) => new Intl.NumberFormat(locale, {useGrouping: false}));

export type MonthDatum = Datum<Month>;

export class Months extends DatumLookup<Month> {
    private readonly numerals: Numerals

    constructor(data: MonthDatum[], locale: string) {
        super(data);
        this.numerals = Numerals.get(locale);
    }

    parse(value: string): Month {
        const number = get(() => this.numerals.parse(value));
        return isNaN(number) ? super.parse(cleanValue(value)) : number;
    }
}

export type WeekdayDatum = Datum<Weekday>;

export class Weekdays extends DatumLookup<Weekday> {
    parse(value: string): Weekday {
        return super.parse(cleanValue(value));
    }
}