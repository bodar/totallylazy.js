import {Datum} from "./datum";
import {array} from "../array";
import {characters} from "../characters";
import {map, zip} from "../transducers";
import {DatumLookup} from "./datumLookup";
import {Spaces} from "./spaces";
import {caching} from "../cache";

export type Numeral = Datum<number>;

export const numberFormatter = caching((locale: string) => new Intl.NumberFormat(locale, {useGrouping: false}));
export const digits = caching((locale: string) => {
    const characters = Numerals.get(locale).characters.join('');
    if (characters === '0123456789') return '\\d';
    return `\\d${characters}`;
});
export const allowedSeparators = `٬٫,.'’‘${Spaces.spaces}`;
export const numberPattern = caching((locale: string) => {
    const d = digits(locale);
    return `-?(?:[${d}]+[${allowedSeparators}])*[${d}]+`;
});

export function numberOf(value: string): number {
    if (!value || value.trim().length === 0) return NaN;
    return Number(value);
}

export class Numerals extends DatumLookup<number> {
    constructor(data: Numeral[], private locale: string) {
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

    format(value: number): string {
        return numberFormatter(this.locale).format(value);
    }
}