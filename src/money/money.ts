import NumberFormatPart = Intl.NumberFormatPart;
import {characters, NamedMatch, NamedRegExp} from "../characters";
import {filter, flatMap, map} from "../transducers";
import {sequence} from "../sequence";
import {array} from "../collections";
import {unique} from "../arrays";

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

export function partsFrom(money: Money, locale?: string, currencyDisplay: CurrencyDisplay = 'code'): NumberFormatPart[] {
    const formatter = new Intl.NumberFormat(locale, {currencyDisplay, currency: money.currency, style: 'currency'});
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

const currencies = ["AED", "ANG", "AUD", "CHE", "CHF", "CHW", "EUR", "GBP", "HKD", "HNL", "HTG", "HUF", "IDR", "ILS", "INR", "IQD", "IRR", "ISK", "JMD", "JOD", "JPY", "KES", "KGS", "KPW", "KRW", "KWD", "KZT", "LAK", "LBP", "LKR", "LRD", "LSL", "LYD", "MAD", "MDL", "MGA", "MKD", "MMK", "MNT", "MOP", "MRU", "MUR", "MVR", "MWK", "MXN", "MXV", "MYR", "MZN", "NAD", "NGN", "NIO", "NOK", "NPR", "NZD", "OMR", "PAB", "PEN", "PGK", "PHP", "PKR", "PLN", "PYG", "QAR", "RON", "RSD", "RUB", "RWF", "SAR", "SBD", "SCR", "SDG", "SEK", "SGD", "SHP", "SLL", "SOS", "SRD", "SSP", "STN", "SYP", "SZL", "THB", "TJS", "TMT", "TND", "TOP", "TRY", "TTD", "TWD", "TZS", "UAH", "UGX", "USD", "USN", "UYI", "UYU", "UYW", "UZS", "VES", "VND", "VUV", "WST", "XAG", "XAU", "XBA", "XBB", "XBC", "XBD", "XCD", "XDR", "XOF", "XPD", "XPF", "XPT", "XSU", "XTS", "XUA", "XXX", "YER", "ZAR", "ZMW", "ZWL"];
const symbols = currencies.map(symbolFor);
const symbolPattern = `[${unique(array(sequence(symbols, filter(Boolean), flatMap(characters)))).sort().join('')}]{1,3}`;

export function symbolFor(isoCurrency:string): string | undefined {
    const parts = partsFrom(money(isoCurrency, 0), undefined, "symbol");
    const [currency] = parts.filter(p => p.type === 'currency');
    if (!currency) throw new Error("No currency found");
    return currency.value !== isoCurrency ? currency.value : undefined;
}

const exampleMoney = money('GBP', 1234567.89);

export function regexParser(locale?: string): Parser<NumberFormatPart[]> {
    const parts = partsFrom(exampleMoney, locale);
    const [group = ''] = parts.filter(p => p.type === 'group').map(p => p.value);
    const noGroups = parts.filter(p => p.type !== 'group');

    let integerAdded = false;

    const namedPattern = noGroups.map(part => {
        switch (part.type) {
            case "currency":
                return `(?<currency>[A-Z]{3}|${symbolPattern})`;
            case "decimal":
                return `(?<decimal>[${part.value}]?)`;
            case "fraction":
                return `(?<fraction>\\d*)`;
            case "integer":
                if (integerAdded) {
                    return '';
                } else {
                    integerAdded = true;
                    return `(?<integer-group>[\\d${group}]+)`;
                }
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

    preProcess(value:string) {
        return value;
    }

    abstract convert(matches: NamedMatch[]): T
}

const integers = NamedRegExp.create('(?<integer>\\d+)');

export class NumberFormatPartParser extends BaseParser<NumberFormatPart[]> {
    convert(matches: NamedMatch[]) {
        return array(sequence(matches, filter(m => Boolean(m.value)), flatMap((m: NamedMatch) => {
            const type = m.name;
            if (type === 'integer-group') {
                return array(sequence(integers.iterate(m.value), filter(m => Boolean(m)), map(m => {
                    if (Array.isArray(m)) {
                        return {type: 'integer', value: m[0].value} as NumberFormatPart;
                    } else {
                        return {type: 'group', value: m} as NumberFormatPart;
                    }
                })));
            } else {
                return [{
                    type,
                    value: m.value.toLocaleUpperCase(this.locale)
                } as NumberFormatPart];
            }
        })));
    }
}

export interface Parser<T> {
    parse(value: string): T;

    parseAll(value: string): T[];
}