import NumberFormatPart = Intl.NumberFormatPart;
import {isNamedMatch, MatchOrNot, NamedMatch, NamedRegExp} from "../characters";
import {dedupe, filter, flatMap, map} from "../transducers";
import {array, by} from "../collections";
import {flatten} from "../arrays";
import {currencies} from "./currencies";
import {cache} from "../lazy";
import {Datum, DatumLookup} from "../dates";
import {BaseParser, MappingParser, MatchStrategy, Parser} from "../parsing";
import {Currencies, Currency} from "./currencies-def";

/**
 * Parsing flow
 *
 *   (string + locale) -> parts -> money
 *
 * Building a parser
 *
 *   locale -> money -> parts -> named pattern
 */


export interface Money {
    currency: string;
    amount: number;
}

export function money(currency: string, amount: number): Money {
    return {amount, currency};
}

export function moneyFrom(parts: NumberFormatPart[], locale?: string, options?: Options): Money {
    const [currency] = parts.filter(p => p.type === 'currency');
    if (!currency) throw new Error("No currency found");
    const filtered = parts.filter(p => p.type === 'integer' || p.type === 'decimal' || p.type === 'fraction');
    const value = Number(filtered.map(p => p.type === 'decimal' ? '.' : p.value).join(''));
    return money(CurrencySymbols.get(locale).parse(currency.value, options && options.strategy), value)
}

export type CurrencyDisplay = 'symbol' | 'code';

export function decimalsFor(code: keyof Currencies) {
    const currency = currencies[code];
    return currency ? currency.decimals : 2;
}

export class Formatter {
    @cache
    static create(currency: string, locale?: string, currencyDisplay: CurrencyDisplay = 'code') {
        const decimals = decimalsFor(currency);
        return new Intl.NumberFormat(locale, {
            currencyDisplay,
            currency,
            style: 'currency',
            minimumFractionDigits: 0,
            maximumFractionDigits: decimals
        });
    }
}

export function partsFrom(money: Money, locale?: string, currencyDisplay: CurrencyDisplay = 'code'): NumberFormatPart[] {
    return Formatter.create(money.currency, locale, currencyDisplay).formatToParts(money.amount);
}

export function format(money: Money, locale?: string, currencyDisplay: CurrencyDisplay = 'code'): string {
    return partsFrom(money, locale, currencyDisplay).map(p => p.value).join('');
}

export function parse(value: string, locale?: string, options?: Options): Money {
    return moneyFrom(parseToParts(value, locale), locale, options);
}

export function parser(locale?: string, options?: Options): Parser<Money> {
    return new MappingParser(RegexParser.create(locale, options), p => moneyFrom(p, locale, options));
}

export function parseToParts(value: string, locale?: string): NumberFormatPart[] {
    return RegexParser.create(locale).parse(value);
}

export interface Options {
    strategy?: MatchStrategy<string>;
    format?: string;
}

export type CurrencySymbolDatum = Datum<string>;

export class CurrencySymbols extends DatumLookup<string> {
    static cache: { [key: string]: CurrencySymbols } = {};

    static get(locale: string = 'default', additionalData: CurrencySymbolDatum[] = []): CurrencySymbols {
        return CurrencySymbols.cache[locale] = CurrencySymbols.cache[locale] || CurrencySymbols.create(locale, additionalData);
    }

    static set(locale: string = 'default', months: CurrencySymbols): CurrencySymbols {
        return CurrencySymbols.cache[locale] = months;
    }

    static create(locale: string = 'default', additionalData: CurrencySymbolDatum[] = []): CurrencySymbols {
        return new CurrencySymbols([...CurrencySymbols.generateData(locale), ...additionalData]);
    }

    static generateData(locale: string = 'default'): CurrencySymbolDatum[] {
        return flatten(Object.keys(currencies).map(c => CurrencySymbols.dataFor(locale, c, currencies[c])));
    }

    static dataFor(locale: string, iso: string, currency: Currency): CurrencySymbolDatum[] {
        return [{name: iso, value: iso},
            {name: symbolFor(locale, iso), value: iso},
            ...currency.symbols.map(s => ({name: s, value: iso}))];
    }
}

export function symbolFor(locale: string, isoCurrency: string): string {
    const parts = partsFrom(money(isoCurrency, 0), locale, "symbol");
    const [currency] = parts.filter(p => p.type === 'currency');
    if (!currency) throw new Error("No currency found");
    return currency.value;
}

const exampleMoney = money('GBP', 1234567.89);

export class RegexParser {
    @cache
    static create(locale?: string, options?:Options): Parser<NumberFormatPart[]> {
        const originalPattern = options && options.format ? this.buildFrom(partsFromFormat(options.format)) : this.buildPattern(locale);
        return new NumberFormatPartParser(NamedRegExp.create(originalPattern));
    }

    static buildPattern(locale?: string): string {
        return this.buildFrom(partsFrom(exampleMoney, locale), locale);
    }

    static buildFrom(parts: NumberFormatPart[], locale?: string) {
        const [group = ''] = parts.filter(p => p.type === 'group').map(p => p.value);
        const noGroups = array(parts, filter(p => p.type !== 'group'), dedupe(by('type')));

        return noGroups.map(part => {
            switch (part.type) {
                case "currency":
                    return `(?<currency>${CurrencySymbols.get(locale).pattern})`;
                case "decimal":
                    return `(?<decimal>[${part.value}]?)`;
                case "fraction":
                    return `(?<fraction>\\d*)`;
                case "integer":
                    return `(?<integer-group>[\\d${group}]+)`;
                default:
                    return `(?<${part.type}>[${part.value} ]?)`;
            }
        }).join("");
    }
}

export function parseIntegerGroup(regex:NamedRegExp, m: NamedMatch): NumberFormatPart[] {
    return array(regex.iterate(m.value), filter(m => Boolean(m)), map(m => {
        if (isNamedMatch(m)) {
            return {type: 'integer', value: m[0].value} as NumberFormatPart;
        } else {
            return {type: 'group', value: m} as NumberFormatPart;
        }
    }));
}

export class NumberFormatPartParser extends BaseParser<NumberFormatPart[]> {
    private integers = NamedRegExp.create('(?<integer>\\d+)');

    convert(matches: NamedMatch[]) {
        return array(matches, filter(m => Boolean(m.value)), flatMap((m: NamedMatch) => {
            if (m.name === 'integer-group') {
                return parseIntegerGroup(this.integers, m);
            } else {
                return [{type: m.name, value: m.value} as NumberFormatPart];
            }
        }));
    }
}

const formatRegex = NamedRegExp.create('(?:(?<integer-group>(?:i.*i|i))(?<decimal>[^f])(?<fraction>f+)|(?<currency>C+))', 'g');

export function partsFromFormat(format: string): NumberFormatPart[] {
    const integers = NamedRegExp.create('(?<integer>i+)');

    return array(formatRegex.iterate(format), flatMap((matchOrNot:MatchOrNot) => {
        if (isNamedMatch(matchOrNot)) {
            const [first, second, third]: NamedMatch[] = matchOrNot.filter(m => Boolean(m.value));
            if (first.name === 'currency') {
                return [{type: first.name, value: first.value}] as NumberFormatPart[];
            } else {
                return [...parseIntegerGroup(integers, first),
                    {type: second.name, value: second.value},
                    {type: third.name, value: third.value}] as NumberFormatPart[];
            }
        } else {
            return [{type: "literal", value: matchOrNot}];
        }
    }));
}

