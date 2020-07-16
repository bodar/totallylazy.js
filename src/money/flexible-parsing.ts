import {CurrencySymbols, decimalsFor, money, Money, Spaces} from "./money";
import {atBoundaryOnly, MatchStrategy, Numerals, Parser} from "../parsing";
import {characters, NamedMatch, NamedRegExp} from "../characters";
import {filter, find, first, flatMap, map, sort} from "../transducers";
import {array, by, descending, Mapper, single} from "../collections";
import {unique} from "../arrays";
import {cache, caching} from "../cache";
import {lazy} from "../lazy";
import {get} from "../functions";

export interface Options {
    strategy?: MatchStrategy<string>;
    decimalSeparator?: AllowedDecimalSeparators
}

export function flexibleParse(value: string, locale: string = 'en', options?: Options): Money {
    return new FlexibleMoneyParser(locale, options).parse(value)
}


const allowedSeparators = `٬٫,.'’${Spaces.spaces}`;
const numberPattern = caching((locale: string) => {
    const digits = `[\\d${Numerals.get(locale).characters.join('')}]+`;
    return `(?:${digits}[${allowedSeparators}])*${digits}`;
});

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
    constructor(private locale: string, private options?: Options) {
    }

    @lazy
    private get pattern(): NamedRegExp {
        return FlexibleMoneyParser.patternFor(this.locale);
    }

    @cache
    private static patternFor(locale: string): NamedRegExp {
        return NamedRegExp.create(atBoundaryOnly(`(?<currency>${CurrencySymbols.get(locale).pattern})?(?<literal>[${Spaces.spaces}])?(?<number>${numberPattern(locale)})(?<literal>[${Spaces.spaces}])?(?<currency>${CurrencySymbols.get(locale).pattern})?`));
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
        const {currency} = single(result,
            filter(m => m.name === 'currency' && m.value !== undefined),
            flatMap(m => {
                try {
                    const currency = CurrencySymbols.get(this.locale).parse(m.value, this.options && this.options.strategy);
                    return [{currency, exactMatch: currency === m.value}];
                } catch (e) {
                    return [];
                }
            }),
            sort(by('exactMatch', descending)),
            first());
        const amount = single(result, find(m => m.name === 'number' && m.value !== undefined)).value;
        const instance = numberParser((this.options && this.options.decimalSeparator) || findDecimalSeparator(currency, amount), this.locale);
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
    return value === '.' || value === ',' || value === '٫';
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


export type AllowedDecimalSeparators = '.' | ',' | '٫'

export class NumberParser implements Parser<number> {
    readonly strictNumberPattern: RegExp;
    readonly globalNumberPattern: NamedRegExp;

    constructor(private decimalSeparator: AllowedDecimalSeparators, private locale: string) {
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

    private parseSingle(value: string): number {
        const separators = separatorsOf(value);
        if (separators.length === 0) return this.numberOf(value);
        const lastSeparator = separators[separators.length - 1];
        const groupSeparators = lastSeparator === this.decimalSeparator ? separators.slice(0, separators.length - 1) : separators;
        if (groupSeparators.indexOf(this.decimalSeparator) !== -1) throw new Error(`Unable to parse '${value}'`);
        if (unique(groupSeparators).length > 1) throw new Error(`Unable to parse '${value}'`);

        const numerals = Numerals.get(this.locale);
        const result = characters(value).map(c => {
            if(c === this.decimalSeparator) return '.';
            const number = get(() => numerals.parse(c));
            if(isNaN(number)) return '';
            return number.toString();
        }).join('');
        return this.numberOf(result, value);
    }

    private numberOf(cleaned: string, original: string = cleaned) {
        const result = Number(cleaned);
        if (isNaN(result)) throw new Error(`Unable to parse '${original}'`);
        return result;
    }
}

export function numberParser(decimalSeparator: AllowedDecimalSeparators, locale: string = 'en') {
    return new NumberParser(decimalSeparator, locale);
}
