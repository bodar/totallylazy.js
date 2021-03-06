import {CurrencySymbols, decimalsFor, money, Money} from "./money";
import {
    AllowedDecimalSeparators,
    atBoundaryOnly,
    mapIgnoreError,
    MatchStrategy,
    numberParser,
    numberPattern,
    Parser,
    separatorsOf,
    Spaces
} from "../parsing";
import {NamedMatch, NamedRegExp} from "../characters";
import {filter, find, first, flatMap, sort} from "../transducers";
import {array, by, descending, single} from "../collections";
import {unique} from "../arrays";
import {cache} from "../cache";
import {lazy} from "../lazy";

export interface Options {
    strategy?: MatchStrategy<string>;
    decimalSeparator?: AllowedDecimalSeparators
}

export function flexibleParse(value: string, locale: string = 'en', options?: Options): Money {
    return new FlexibleMoneyParser(locale, options).parse(value)
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


