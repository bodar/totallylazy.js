import NumberFormatPart = Intl.NumberFormatPart;
import {characters, NamedMatch, NamedRegExp} from "../characters";
import {dedupe, filter, flatMap, map} from "../transducers";
import {array, by, Comparator} from "../collections";
import {unique} from "../arrays";
import {Currencies, currencies} from "./currencies";

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

export function money(currency: string, amount: number): Money;
export function money(parts: NumberFormatPart[]): Money;
export function money(currencyOrParts: string | NumberFormatPart[], amount?: number): Money {
    if (!Array.isArray(currencyOrParts) && typeof amount === 'number') {
        return moneyLiteral(currencyOrParts, amount);
    }
    if (Array.isArray(currencyOrParts)) {
        return moneyFrom(currencyOrParts);
    }
    throw new Error("Invalid arguments");
}

function moneyLiteral(currency: string, amount: number): Money {
    return {amount, currency};
}

export function moneyFrom(parts: NumberFormatPart[]): Money {
    const [currency] = parts.filter(p => p.type === 'currency');
    if (!currency) throw new Error("No currency found");
    const filtered = parts.filter(p => p.type === 'integer' || p.type === 'decimal' || p.type === 'fraction');
    const value = Number(filtered.map(p => p.type === 'decimal' ? '.' : p.value).join(''));
    return money(currency.value, value)
}

export type CurrencyDisplay = 'symbol' | 'code';

export function decimalsFor(code: keyof Currencies) {
    const currency = currencies[code];
    return currency ? currency.decimals : 2;
}

export function partsFrom(money: Money, locale?: string, currencyDisplay: CurrencyDisplay = 'code'): NumberFormatPart[] {
    const code = money.currency;
    const decimals = decimalsFor(code);
    const formatter = new Intl.NumberFormat(locale, {
        currencyDisplay,
        currency: code,
        style: 'currency',
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
    });
    return formatter.formatToParts(money.amount);
}

export function format(money: Money, locale?: string, currencyDisplay: CurrencyDisplay = 'code'): string {
    return partsFrom(money, locale, currencyDisplay).map(p => p.value).join('');
}

export function parse(value: string, locale?: string): Money {
    return moneyFrom(parseToParts(value, locale));
}

export function parseToParts(value: string, locale?: string): NumberFormatPart[] {
    return regexParser(locale).parse(value);
}

const symbols = Object.keys(currencies).map(code => symbolFor(code));
const symbolPattern = `[${unique(array(symbols, filter(Boolean), flatMap(characters))).sort().join('')}]{1,3}`;

export function symbolFor(isoCurrency: string): string | undefined {
    const parts = partsFrom(money(isoCurrency, 0), undefined, "symbol");
    const [currency] = parts.filter(p => p.type === 'currency');
    if (!currency) throw new Error("No currency found");
    return currency.value !== isoCurrency ? currency.value : undefined;
}

const exampleMoney = money('GBP', 1234567.89);

export function regexParser(locale?: string): Parser<NumberFormatPart[]> {
    const parts = partsFrom(exampleMoney, locale);
    const [group = ''] = parts.filter(p => p.type === 'group').map(p => p.value);
    const noGroups = array(parts, filter(p => p.type !== 'group'), dedupe(by('type')));

    const namedPattern = noGroups.map(part => {
        switch (part.type) {
            case "currency":
                return `(?<currency>[A-Z]{3}|${symbolPattern})`;
            case "decimal":
                return `(?<decimal>[${part.value}]?)`;
            case "fraction":
                return `(?<fraction>\\d*)`;
            case "integer":
                return `(?<integer-group>[\\d${group}]+)`;
            default:
                return `(?<${part.type}>[${part.value}]?)`;
        }
    }).join("");

    return new NumberFormatPartParser(NamedRegExp.create(namedPattern));
}


export abstract class BaseParser<T> implements Parser<T> {
    constructor(protected regex: NamedRegExp, protected locale?: string) {
    }

    parse(value: string): T {
        const lower = this.preProcess(value);
        const match = this.regex.match(lower);
        if (match.length === 0) throw new Error(`Generated regex ${this.regex.pattern} did not match "${lower}" `);
        return this.convert(match);
    }

    parseAll(value: string): T[] {
        const lower = this.preProcess(value);
        const result: T[] = [];
        for (const match of this.regex.exec(lower)) {
            result.push(this.convert(match));
        }
        return result;
    }

    preProcess(value: string) {
        return value;
    }

    abstract convert(matches: NamedMatch[]): T
}

const integers = NamedRegExp.create('(?<integer>\\d+)');

export class NumberFormatPartParser extends BaseParser<NumberFormatPart[]> {
    convert(matches: NamedMatch[]) {
        return array(matches, filter(m => Boolean(m.value)), flatMap((m: NamedMatch) => {
            const type = m.name;
            if (type === 'integer-group') {
                return array(integers.iterate(m.value), filter(m => Boolean(m)), map(m => {
                    if (Array.isArray(m)) {
                        return {type: 'integer', value: m[0].value} as NumberFormatPart;
                    } else {
                        return {type: 'group', value: m} as NumberFormatPart;
                    }
                }));
            } else {
                return [{
                    type,
                    value: m.value
                } as NumberFormatPart];
            }
        }));
    }
}

export interface Parser<T> {
    parse(value: string): T;

    parseAll(value: string): T[];
}