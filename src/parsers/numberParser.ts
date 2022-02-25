import {Parser} from "./parser";
import {characters, NamedRegExp} from "../characters";
import {array} from "../array";
import {unique} from "../arrays";
import {numberOf, numberPattern, Numerals} from "./numerals";
import {get} from "../functions";
import {
    AllowedDecimalSeparators,
    inferDecimalSeparator,
    isDecimalSeparator,
    mapIgnoreError,
    separatorsOf
} from "./parsing";

export class NumberParser implements Parser<number> {
    readonly strictNumberPattern: RegExp;
    readonly globalNumberPattern: NamedRegExp;

    constructor(private decimalSeparator: (amount: string) => AllowedDecimalSeparators, private locale: string) {
        this.strictNumberPattern = new RegExp(`^${numberPattern(locale)}$`);
        this.globalNumberPattern = NamedRegExp.create(`(?<number>${numberPattern(locale)})`, 'g');
    }

    parse(value: string): number {
        if (!this.strictNumberPattern.test(value)) throw new Error(`Unable to parse '${value}'`);
        return this.parseSingle(value);
    }

    parseAll(value: string): number[] {
        return array(this.globalNumberPattern.exec(value), mapIgnoreError(([match]) => this.parseSingle(match.value.trim())));
    }

    private parseSingle(value: string, decimalSeparator = this.decimalSeparator(value)): number {
        const separators = separatorsOf(value);
        if (separators.length === 0) return this.numberOf(value, decimalSeparator);
        const lastSeparator = separators[separators.length - 1];
        const groupSeparators = lastSeparator === decimalSeparator ? separators.slice(0, separators.length - 1) : separators;
        if (groupSeparators.indexOf(decimalSeparator) !== -1) throw new Error(`Unable to parse '${value}'`);
        if (unique(groupSeparators).length > 1) throw new Error(`Unable to parse '${value}'`);

        return this.numberOf(value, decimalSeparator);
    }

    private convert(value: string, decimalSeparator: AllowedDecimalSeparators): string {
        const numerals = Numerals.get(this.locale);
        return characters(value).map(c => {
            if (c === decimalSeparator) return '.';
            if (c === '-') return '-';
            const number = get(() => numerals.parse(c));
            if (isNaN(number)) return '';
            return number.toString();
        }).join('');
    }

    private numberOf(value: string, decimalSeparator: AllowedDecimalSeparators) {
        const text = this.convert(value, decimalSeparator);
        const result = numberOf(text);
        if (isNaN(result)) {
            throw new Error(`Unable to parse '${value}'`);
        }
        return result;
    }
}

export type Locale = string;

export function numberParser(): Parser<number>;
export function numberParser(decimalSeparatorOrLocale: AllowedDecimalSeparators | Locale): Parser<number>;
export function numberParser(decimalSeparator: AllowedDecimalSeparators, locale: Locale): Parser<number>;
export function numberParser(decimalSeparatorOrLocale?: AllowedDecimalSeparators | Locale, locale: Locale = 'en'): Parser<number> {
    if (!decimalSeparatorOrLocale) return numberParser(locale);
    if (isDecimalSeparator(decimalSeparatorOrLocale)) return new NumberParser(ignore => decimalSeparatorOrLocale, locale);
    return numberParser(inferDecimalSeparator(decimalSeparatorOrLocale), decimalSeparatorOrLocale);
}