import {CurrencySymbols, decimalsFor, money, Money, Spaces} from "./money";
import {MatchStrategy, Parser} from "../parsing";
import {NamedMatch, NamedRegExp} from "../characters";
import {find, map} from "../transducers";
import {array, single} from "../collections";

export interface Options {
    strategy?: MatchStrategy<string>;
    decimalSeparator?: AllowedDecimalSeparators
}

export function flexibleParse(value: string, locale: string = 'en', options?: Options): Money {
    return new FlexibleMoneyParser(locale, options).parse(value)
}

const allowedSeparators = `,.'’${Spaces.spaces}`;
const numberPattern = `[\\d${allowedSeparators}]*\\d+`;


export class FlexibleMoneyParser implements Parser<Money> {
    readonly pattern = NamedRegExp.create(`(?<currency>${CurrencySymbols.get(this.locale).pattern})?(?<literal>[${Spaces.spaces}]+)?(?<number>${numberPattern})(?<literal>[${Spaces.spaces}]+)?(?<currency>${CurrencySymbols.get(this.locale).pattern})?`);

    constructor(private locale: string, private options?: Options) {
    }

    parse(value: string): Money {
        return this.parseSingle(this.pattern.match(value));
    }

    parseAll(value: string): Money[] {
        return array(this.pattern.exec(value), map(match => this.parseSingle(match)));
    }

    private parseSingle(result: NamedMatch[]) {
        const currencyLiteral = single(result, find(m => m.name === 'currency' && m.value !== undefined)).value;
        const amount = single(result, find(m => m.name === 'number' && m.value !== undefined)).value;
        const currency = CurrencySymbols.get(this.locale).parse(currencyLiteral, this.options && this.options.strategy);
        return money(currency, numberParser((this.options && this.options.decimalSeparator) || findDecimalSeparator(currency, amount)).parse(amount));
    }
}

export function flexibleMoneyParser(locale: string = 'en', options?: Options) {
    return new FlexibleMoneyParser(locale, options);
}

const separatorsPattern = NamedRegExp.create(`(?<separator>[${allowedSeparators}])`);

export function findDecimalSeparator(isoCurrency: string, amount: string): AllowedDecimalSeparators {
    const separators = array(separatorsPattern.exec(amount), map(([match]) => match.value));
    if (separators.length === 0) return '.';
    const [separator] = separators[separators.length - 1];
    const decimalPlaces = decimalsFor(isoCurrency);
    const index = amount.lastIndexOf(separator);
    const placesFromTheEnd = amount.length - index - 1;
    if (placesFromTheEnd === decimalPlaces) {
        if (decimalPlaces === 3 && separators.length === 1) throw new Error(`Can not parse ${amount} as currency ${isoCurrency} has 3 decimal places`);
        if (separator === '.' || separator === ',') return separator;
        throw new Error(`Decimal separators must be a comma or dot but received '${separator}'`);
    }
    return separator === '.' ? ',' : '.';
}


export type AllowedDecimalSeparators = '.' | ','

export class NumberParser implements Parser<number> {
    static readonly strictNumberPattern = new RegExp(`^${numberPattern}$`);
    static readonly globalNumberPattern = NamedRegExp.create(`(?<number>${numberPattern})`, 'g');

    constructor(private decimalSeparator: AllowedDecimalSeparators) {
    }

    parse(value: string): number {
        if (!NumberParser.strictNumberPattern.test(value)) throw new Error(`Unable to parse '${value}'`);
        return this.parseSingle(value);
    }

    parseAll(value: string): number[] {
        return array(NumberParser.globalNumberPattern.exec(value), map(([match]) => this.parseSingle(match.value.trim())));
    }

    private parseSingle(value: string): number {
        const result = Number(value.replace(new RegExp(`[^${this.decimalSeparator}\\d]`), '').replace(this.decimalSeparator, '.'));
        if (isNaN(result)) throw new Error(`Unable to parse '${value}'`);
        return result;
    }
}

export function numberParser(decimalSeparator: AllowedDecimalSeparators) {
    return new NumberParser(decimalSeparator);
}
