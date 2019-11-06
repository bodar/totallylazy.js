import {atBoundaryOnly, CurrencySymbols, decimalsFor, money, Money, Spaces} from "./money";
import {MatchStrategy, Parser} from "../parsing";
import {NamedMatch, NamedRegExp} from "../characters";
import {find, flatMap, map} from "../transducers";
import {array, Mapper, single} from "../collections";
import {unique} from "../arrays";

export interface Options {
    strategy?: MatchStrategy<string>;
    decimalSeparator?: AllowedDecimalSeparators
}

export function flexibleParse(value: string, locale: string = 'en', options?: Options): Money {
    return new FlexibleMoneyParser(locale, options).parse(value)
}


const allowedSeparators = `,.'’${Spaces.spaces}`;
const numberPattern = `(?:\\d+[${allowedSeparators}])*\\d+`;


export function mapIgnoreError<A, B>(mapper: Mapper<A, B>) {
    return flatMap((value: A) => {
        try {
            return [mapper(value)]
        } catch (e) {
            return [];
        }
    });
}

export class FlexibleMoneyParser implements Parser<Money> {
    readonly pattern = NamedRegExp.create(atBoundaryOnly(`(?<currency>${CurrencySymbols.get(this.locale).pattern})?(?<literal>[${Spaces.spaces}])?(?<number>${numberPattern})(?<literal>[${Spaces.spaces}])?(?<currency>${CurrencySymbols.get(this.locale).pattern})?`));

    constructor(private locale: string, private options?: Options) {
    }

    parse(value: string): Money {
        try {
            return this.parseSingle(this.pattern.match(value));
        } catch (e) {
            throw new Error(`Unable to parse ${value}`);
        }
    }

    parseAll(value: string): Money[] {
        return array(this.pattern.exec(value), mapIgnoreError(match => this.parseSingle(match)));
    }

    private parseSingle(result: NamedMatch[]) {
        const currencyLiteral = single(result, find(m => m.name === 'currency' && m.value !== undefined)).value;
        const amount = single(result, find(m => m.name === 'number' && m.value !== undefined)).value;
        const currency = CurrencySymbols.get(this.locale).parse(currencyLiteral, this.options && this.options.strategy);
        const instance = numberParser((this.options && this.options.decimalSeparator) || findDecimalSeparator(currency, amount));
        return money(currency, instance.parse(amount));
    }
}

export function flexibleMoneyParser(locale: string = 'en', options?: Options) {
    return new FlexibleMoneyParser(locale, options);
}

const separatorsPattern = NamedRegExp.create(`(?<separator>[${allowedSeparators}])`);

function separatorsOf(amount: string): string[] {
    return array(separatorsPattern.exec(amount), map(([match]) => match.value));
}

function isDecimalSeparator(value: string): value is AllowedDecimalSeparators {
    return value === '.' || value === ',';
}

function decimalSeparator(value: string): AllowedDecimalSeparators {
    if (isDecimalSeparator(value)) return value;
    throw new Error(`Invalid decimal separator${value}`);
}

function flip(value: string): AllowedDecimalSeparators {
    return value === "." ? "," : ".";
}

export function findDecimalSeparator(isoCurrency: string, amount: string): AllowedDecimalSeparators {
    const separators = separatorsOf(amount);

    if (separators.length === 0) return '.';

    const lastSeparator = separators[separators.length - 1];
    const placesFromTheEnd = amount.length - amount.lastIndexOf(lastSeparator) - 1;
    const decimalPlaces = decimalsFor(isoCurrency);

    if (separators.length === 1) {
        if (placesFromTheEnd === 3) {
            if (decimalPlaces === 3) throw new Error(`Can not parse ${amount} as separator is ambiguous`);
            return flip(lastSeparator);
        }
        return decimalSeparator(lastSeparator);
    }

    const uniqueSeparators = unique(separators);
    if (uniqueSeparators.length === 1) return flip(lastSeparator);

    return decimalSeparator(lastSeparator);
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
        return array(NumberParser.globalNumberPattern.exec(value), mapIgnoreError(([match]) => this.parseSingle(match.value.trim())));
    }

    private parseSingle(value: string): number {
        const separators = separatorsOf(value);
        if (separators.length === 0) return this.numberOf(value);
        const lastSeparator = separators[separators.length - 1];
        const groupSeparators = lastSeparator === this.decimalSeparator ? separators.slice(0, separators.length - 1) : separators;
        if (groupSeparators.indexOf(this.decimalSeparator) !== -1) throw new Error(`Unable to parse '${value}'`);
        if (unique(groupSeparators).length > 1) throw new Error(`Unable to parse '${value}'`);

        const noGroupSeparator = value.replace(new RegExp(`[^${this.decimalSeparator}\\d]`, 'g'), '').replace(this.decimalSeparator, '.');
        return this.numberOf(noGroupSeparator, value);
    }

    private numberOf(cleaned: string, original: string = cleaned) {
        const result = Number(cleaned);
        if (isNaN(result)) throw new Error(`Unable to parse '${original}'`);
        return result;
    }
}

export function numberParser(decimalSeparator: AllowedDecimalSeparators) {
    return new NumberParser(decimalSeparator);
}
