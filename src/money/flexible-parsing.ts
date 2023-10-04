import {CurrencySymbols, decimalsFor, money, Money} from "./money";
import {
    FailParser, Parser, TypeSafeParser
} from "../parsing";
import {NamedMatch, NamedRegExp, removeUnicodeMarkers} from "../characters";
import {filter, find, first, flatMap, single, sort} from "../transducers";
import {by, descending} from "../collections";
import {unique} from "../arrays";
import {cache} from "../cache";
import {lazy} from "../lazy";
import {get} from "../functions";
import {array} from "../array";
import {
    AllowedDecimalSeparators, atBoundaryOnly,
    decimalSeparator, inferDecimalSeparator, mapIgnoreError, MatchStrategy,
    NumberParser,
    numberParser, numberPattern,
    separatorsOf, Spaces
} from "../dates";
import {infer} from "./strategy";

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
            return this.parseSingle(this.pattern.match(removeUnicodeMarkers(value)));
        } catch (e) {
            throw new Error(`Unable to parse ${value}`);
        }
    }

    parseAll(value: string): Money[] {
        return array(this.pattern.exec(removeUnicodeMarkers(value)), mapIgnoreError(match => this.parseSingle(match)));
    }

    private parseSingle(result: NamedMatch[]) {
        const {currency} = single(result,
            filter(m => m.name === 'currency' && m.value !== undefined),
            flatMap(m => {
                try {
                    const currency = CurrencySymbols.get(this.locale).parse(m.value, (this.options && this.options.strategy) || infer(this.locale));
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
    return new TypeSafeParser(new FlexibleMoneyParser(locale, options));
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

export interface ImplicitMoneyParserOptions {
    currency: string;
    locale?: string;
    strategy?: MatchStrategy<string>;
}

class ImplicitMoneyParser implements Parser<Money> {
    constructor(private currency: string,
                locale: string,
                private parser = new NumberParser(amount => get(() => findDecimalSeparator(currency, amount), inferDecimalSeparator(locale)), locale)) {
    }

    parse(value: string): Money {
        const amount = this.parser.parse(value);
        return {currency: this.currency, amount};
    }

    parseAll(value: string): Money[] {
        return this.parser.parseAll(value).map(amount => ({amount, currency: this.currency}));
    }
}

export function implicitMoneyParser({currency, locale = 'en', strategy = infer(locale)}: ImplicitMoneyParserOptions): Parser<Money> {
    if(!currency) return new FailParser();
    return new TypeSafeParser(new ImplicitMoneyParser(CurrencySymbols.get(locale).parse(currency, strategy), locale));
}