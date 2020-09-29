import {different, isNamedMatch, MatchOrNot, NamedMatch, NamedRegExp} from "../characters";
import {dedupe, filter, first, flatMap, map, sort} from "../transducers";
import {array, ascending, by, descending, single} from "../collections";
import {flatten} from "../arrays";
import {currencies} from "./currencies";
import {lazy} from "../lazy";
import {
    AllowedDecimalSeparators,
    atBoundaryOnly,
    boundaryDelimiters, Datum, DatumLookup,
    digits,
    infer,
    mappingParser,
    MatchStrategy,
    namedRegexParser, numberParser, Numerals,
    Parser,
    Spaces
} from "../parsing";
import {Currencies, Currency} from "./currencies-def";
import {cache} from "../cache";
import NumberFormatPart = Intl.NumberFormatPart;
import {get} from "../functions";

/**
 *
 * Building a parser (implementing parseToParts)
 *
 *   locale -> example-money -> formatToParts() -> parts -> named pattern
 *
 *
 * Parsing flow (uses parseToParts)
 *
 *   (string + locale) -> parts -> money
 *
 *
 * formatToParts (non-native)
 *
 *   example-money -> format (native) -> example-money-pattern -> examples-part -> example-pattern
 *   actual-money ->  format (native) -> example-pattern -> actual-parts
 *
 */


export interface Money {
    currency: string;
    amount: number;
}

export function money(currency: string, amount: number): Money {
    return {amount, currency};
}

export function moneyFrom(parts: NumberFormatPart[], locale: string, options?: Options): Money {
    const {currency} = single(parts,
        filter(m => m.type === 'currency'),
        flatMap(m => {
            try {
                const currency = CurrencySymbols.get(locale).parse(m.value, options && options.strategy);
                return [{currency, exactMatch: currency === m.value}];
            } catch (e) {
                return [];
            }
        }),
        sort(by('exactMatch', descending)),
        first());
    const filtered = parts.filter(p => p.type === 'integer' || p.type === 'decimal' || p.type === 'fraction');
    const decimal = get(() => parts.filter(p => p.type === 'decimal')[0].value, '.');
    const text = filtered.map(p => p.value).join('');
    const value = numberParser(decimal as AllowedDecimalSeparators, locale).parse(text)
    return money(currency, value)
}

export type CurrencyDisplay = 'symbol' | 'code';

export function decimalsFor(code: keyof Currencies) {
    const currency = currencies[code];
    return currency ? currency.decimals : 2;
}

export class Formatter {
    @cache
    static create(currency: string, locale: string, currencyDisplay: CurrencyDisplay = 'code') {
        return new Intl.NumberFormat(locale, {
            currencyDisplay,
            currency,
            style: 'currency',
            minimumFractionDigits: 0,
            maximumFractionDigits: decimalsFor(currency)
        });
    }
}

export const hasNativeToParts = typeof Intl.NumberFormat.prototype.formatToParts == 'function';

export function partsFrom(money: Money, locale: string, currencyDisplay: CurrencyDisplay = 'code', hasNative = hasNativeToParts): NumberFormatPart[] {
    const formatter = Formatter.create(money.currency, locale, currencyDisplay);
    return hasNative ? formatter.formatToParts(money.amount) : toPartsPonyfill(money, locale, currencyDisplay);
}

export function format(money: Money, locale: string, currencyDisplay: CurrencyDisplay = 'code'): string {
    return Formatter.create(money.currency, locale, currencyDisplay).format(money.amount);
}

export function toPartsPonyfill(actual: Money, locale: string, currencyDisplay: CurrencyDisplay = 'code'): NumberFormatPart[] {
    const currency = actual.currency;
    const amount = actual.amount;
    return FormatToParts.create(currency, locale, currencyDisplay).format(amount);
}

const exampleMoney = money('GBP', 111222.3333);

export class FormatToParts {
    constructor(private currency: string,
                private currencyDisplay: CurrencyDisplay,
                private parser: Parser<NumberFormatPart[]>,
                private locale: string) {
    }

    @cache
    static create(currency: string, locale: string, currencyDisplay: CurrencyDisplay = 'code'): FormatToParts {
        const exampleFormatted = Formatter.create(currency, locale, currencyDisplay).format(exampleMoney.amount);
        const exampleParts = PartsFromFormat.examplePattern(locale).parse(exampleFormatted);
        const genericPattern = RegexBuilder.buildFrom(exampleParts, locale);
        const genericPartsParser = NumberFormatPartParser.create(locale, genericPattern);
        return new FormatToParts(currency, currencyDisplay, genericPartsParser, locale);
    }

    format(amount: number): Intl.NumberFormatPart[] {
        const formatter = Formatter.create(this.currency, this.locale, this.currencyDisplay);
        return this.parser.parse(formatter.format(amount));
    }

}

export function parse(value: string, locale: string, options?: Options): Money {
    return moneyFrom(parseToParts(value, locale, options), locale, options);
}


export function parser(locale: string, options?: Options): Parser<Money> {
    return MoneyParser.create(locale, options);
}

export function parseToParts(value: string, locale: string, options?: Options): NumberFormatPart[] {
    return NumberFormatPartParser.create(locale, options).parse(value);
}

/**
 *  Given an example money like: 'USD 1,234.567' and a format 'CCC iii.fff'
 *
 *  i: Integer including group separator (1,234)
 *  f: Fraction after the decimal separator (567)
 *  C: ISO currency code or symbol (USD or $)
 *
 *  Currently the number of format characters is just ignored and the user should just use them to help readability.
 *  This may change in future if needed to be more strict.
 *
 *  so 'CCC iii.fff' is the same as 'C i.f'
 */
export type Format = string;

export interface Options {
    strategy?: MatchStrategy<string>;
    format?: Format;
    strict?: boolean;
}

export type CurrencySymbolDatum = Datum<string>;

export class CurrencySymbols extends DatumLookup<string> {
    static cache: { [key: string]: CurrencySymbols } = {};

    constructor(data: Datum<string>[], private locale:string) {
        super(data.map(d => {
            return ({name: d.name.replace(CurrencySymbols.extraDelimiters, ''), value: d.value});
        }), ascending);
    }

    static get(locale: string, additionalData: CurrencySymbolDatum[] = []): CurrencySymbols {
        return CurrencySymbols.cache[locale] = CurrencySymbols.cache[locale] || CurrencySymbols.create(locale, additionalData);
    }

    static set(locale: string, months: CurrencySymbols): CurrencySymbols {
        return CurrencySymbols.cache[locale] = months;
    }

    static create(locale: string, additionalData: CurrencySymbolDatum[] = []): CurrencySymbols {
        return new CurrencySymbols([...CurrencySymbols.generateData(locale), ...additionalData], locale);
    }

    static generateData(locale: string): CurrencySymbolDatum[] {
        return flatten(Object.keys(currencies).map(c => CurrencySymbols.dataFor(locale, c, currencies[c])));
    }

    static generateAdditionalSymbols = ['$', '¥', '£'];

    static dataFor(locale: string, iso: string, currency: Currency): CurrencySymbolDatum[] {
        return [{name: iso, value: iso},
            {name: symbolFor(locale, iso), value: iso},
            ...array(currency.symbols, flatMap(s => {
                const result = [{name: s, value: iso}];
                if (CurrencySymbols.generateAdditionalSymbols.indexOf(s) !== -1) {
                    const countyCode = iso.substring(0, 2);
                    result.push({name: s + countyCode, value: iso});
                    result.push({name: countyCode + s, value: iso});
                    result.push({name: iso + s, value: iso});
                }
                return result;
            }))];
    }

    static readonly extraDelimiters = new RegExp(`[${boundaryDelimiters}]$`);

    parse(value: string, strategy: MatchStrategy<string> = infer(this.locale)): string {
        return super.parse(value.replace(CurrencySymbols.extraDelimiters, ''), strategy);
    }
}

const gbpSymbol = /[£GBP]+/;

export function symbolFor(locale: string, isoCurrency: string, hasNative = hasNativeToParts): string {
    if (hasNative) {
        const parts = partsFrom(money(isoCurrency, 0), locale, "symbol");
        const [currency] = parts.filter(p => p.type === 'currency');
        if (!currency) throw new Error("No currency found");
        return currency.value;
    } else {
        const example = Formatter.create('GBP', locale, "symbol").format(1).replace(gbpSymbol, '@@@');
        const other = Formatter.create(isoCurrency, locale, "symbol").format(1);
        const [, result] = different([example, other]);
        if (!result) return '£';
        return result.replace(Spaces.pattern, '');
    }
}

export class RegexBuilder {
    static buildFromOptions(locale: string, options?: Options): string {
        return options && options.format ? this.buildFrom(PartsFromFormat.format.parse(options.format), locale, true) : this.buildPattern(locale, options && options.strict || false);
    }

    static buildPattern(locale: string, strict: boolean = false): string {
        return this.buildFrom(partsFrom(exampleMoney, locale), locale, strict);
    }

    static buildFrom(raw: NumberFormatPart[], locale: string, strict: boolean = false): string {
        const noGroups = this.buildParts(raw, strict);
        const [group = ''] = raw.filter(p => p.type === 'group').map(p => p.value);
        const d = digits(locale);

        const pattern = noGroups.map(part => {
            switch (part.type) {
                case "currency":
                    return `(?<currency>${CurrencySymbols.get(locale).pattern})?`;
                case "decimal":
                    return `(?<decimal>[${part.value}]?)`;
                case "fraction":
                    return `(?<fraction>[${d}]*)`;
                case "integer":
                    return `(?<integer-group>[${d}${Spaces.handle(group)}]*[${d}]+)`;
                default:
                    return `(?<${part.type}>[${Spaces.handle(part.value)}]?)`;
            }
        }).join("");
        return atBoundaryOnly(pattern);
    }

    static buildParts(raw: Intl.NumberFormatPart[], strict: boolean = false) {
        const parts = [...raw];
        if (!strict) {
            const first = parts[0];
            const last = parts[parts.length - 1];
            const literal: NumberFormatPart = {type: "literal", value: ' '};

            if (first.type === "currency") {
                parts.push(literal, first);
                parts.splice(1, 0, literal)
            } else if (last.type === "currency") {
                parts.unshift(last, literal);
                parts.splice(parts.length - 2, 0, literal)
            }
        }

        return array(parts, filter(p => p.type !== 'group'), dedupe(by('type')));
    }
}

export class MoneyParser {
    static create(locale: string, options?: Options): Parser<Money> {
        return mappingParser(NumberFormatPartParser.create(locale, options), p => moneyFrom(p, locale, options));
    }
}

export class NumberFormatPartParser {
    static create(locale: string, pattern?: string): Parser<NumberFormatPart[]>;
    static create(locale: string, options?: Options): Parser<NumberFormatPart[]>
    @cache
    static create(locale: string, patternOrOption?: string | Options): Parser<NumberFormatPart[]> {
        const pattern = typeof patternOrOption === "string" ? patternOrOption : RegexBuilder.buildFromOptions(locale, patternOrOption);
        return mappingParser(namedRegexParser(NamedRegExp.create(pattern)), m => this.convert(m, locale));
    }

    static convert(matches: NamedMatch[], locale:string) {
        return array(matches, filter(m => Boolean(m.value)), flatMap((m: NamedMatch) => {
            if (m.name === 'integer-group') {
                return IntegerGroupParser.digits(locale).parse(m.value);
            } else {
                return [{type: m.name, value: m.value} as NumberFormatPart];
            }
        }));
    }
}

export class PartsFromFormat {
    private constructor(private formatRegex: NamedRegExp, private integerGroupParser: IntegerGroupParser) {
    }

    parse(format: string): NumberFormatPart[] {
        return array(this.formatRegex.iterate(format), flatMap((matchOrNot: MatchOrNot) => {
            if (isNamedMatch(matchOrNot)) {
                const [integerGroupOrCurrency, decimal, fractions]: NamedMatch[] = matchOrNot.filter(m => Boolean(m.value));
                if (integerGroupOrCurrency.name === 'currency') {
                    return [{
                        type: integerGroupOrCurrency.name,
                        value: integerGroupOrCurrency.value
                    }] as NumberFormatPart[];
                } else {
                    const integerAndGroups = this.integerGroupParser.parse(integerGroupOrCurrency.value);
                    if (decimal) {
                        return [...integerAndGroups,
                            {type: decimal.name, value: decimal.value},
                            {type: fractions.name, value: fractions.value}] as NumberFormatPart[];
                    } else {
                        return integerAndGroups;
                    }
                }
            } else {
                return [{type: "literal", value: matchOrNot}];
            }
        }));
    }


    @lazy
    static get format(): PartsFromFormat {
        const regex = NamedRegExp.create('(?:(?<integer-group>(?:i.*i|i))(?:(?<decimal>[^f])(?<fraction>f+))?|(?<currency>C+))');
        return new PartsFromFormat(regex, IntegerGroupParser.integerFormat);
    }

    @cache
    static examplePattern(locale: string): PartsFromFormat {
        const numerals = Numerals.get(locale);
        const regex = NamedRegExp.create(`(?:(?<integer-group>${numerals.format(1)}.*${numerals.format(2)})(?:(?<decimal>.)(?<fraction>${numerals.format(3)}+))?|(?<currency>${CurrencySymbols.get(locale).pattern}))`);
        return new PartsFromFormat(regex, IntegerGroupParser.digits(locale));
    }
}

export class IntegerGroupParser {
    private constructor(private regex: NamedRegExp) {
    }

    parse(value: string): NumberFormatPart[] {
        return array(this.regex.iterate(value), map(m => {
            if (isNamedMatch(m)) {
                return {type: 'integer', value: m[0].value} as NumberFormatPart;
            } else {
                return {type: 'group', value: m} as NumberFormatPart;
            }
        }));
    }

    @cache
    static digits(locale:string): IntegerGroupParser {
        return new IntegerGroupParser(NamedRegExp.create(`(?<integer>[${digits(locale)}]+)`));
    }

    @lazy
    static get integerFormat(): IntegerGroupParser {
        return new IntegerGroupParser(NamedRegExp.create('(?<integer>i+)'));
    }
}
