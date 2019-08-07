import NumberFormatOptions = Intl.NumberFormatOptions;
import NumberFormatPart = Intl.NumberFormatPart;
import NumberFormatPartTypes = Intl.NumberFormatPartTypes;
import {NamedMatch, NamedRegExp, replace} from "../characters";

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
    value: number;
}

export function money(currency: string, value: number): Money;
export function money(parts: NumberFormatPart[]): Money;
export function money(currencyOrParts: string | NumberFormatPart[], value?: number): Money {
    if (!Array.isArray(currencyOrParts) && value) {
        return moneyLiteral(currencyOrParts, value);
    }
    if (Array.isArray(currencyOrParts)) {
        return moneyFrom(currencyOrParts);
    }
    throw new Error("Invalid arguments");
}

function moneyLiteral(currency: string, value: number) {
    return {value, currency};
}

export function moneyFrom(parts: NumberFormatPart[]): Money {
    const [currency] = parts.filter(p => p.type === 'currency');
    if (!currency) throw new Error("No currency found");
    const filtered = parts.filter(p => p.type === 'integer' || p.type === 'decimal' || p.type === 'fraction');
    const value = Number(filtered.map(p => p.type === 'decimal' ? '.' : p.value).join(''));
    return money(currency.value, value)
}

export function partsFrom(money: Money, locale?: string): NumberFormatPart[] {
    const formatter = new Intl.NumberFormat(locale, {...defaultOptions, currency: money.currency});
    return formatter.formatToParts(money.value);
}

export function parse(value: string, locale?: string): Money {
    return moneyFrom(parseToParts(value, locale));
}

export function parseToParts(value: string, locale?: string): NumberFormatPart[] {
    return regexParser(locale).parse(value);
}

export const defaultOptions: NumberFormatOptions = {
    style: 'currency',
    currencyDisplay: 'code'
};

const exampleMoney = money('GBP', 1234567.89);

export function regexParser(locale?: string): Parser<NumberFormatPart[]> {
    const parts = partsFrom(exampleMoney, locale);

    const namedPattern = parts.map(part => {
        switch (part.type) {
            case "currency":
                return '(?<currency>[a-zA-Z]{3})';
            case "decimal":
                return `(?<decimal>[${part.value}])`;
            case "fraction":
                return `(?<fraction>\\d+)`;
            case "integer":
                return '(?<integer>\\d+)';
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
        const lower = value.toLocaleLowerCase(this.locale);
        const match = this.regex.match(lower);
        if (match.length === 0) throw new Error(`Generated regex ${this.regex.pattern} did not match "${lower}" `);
        return this.convert(match);
    }

    parseAll(value: string): T[] {
        const lower = value.toLocaleLowerCase(this.locale);
        const result: T[] = [];
        for (const match of this.regex.exec(lower)) {
            result.push(this.convert(match));
        }
        return result;
    }

    abstract convert(matches: NamedMatch[]): T
}

export class NumberFormatPartParser extends BaseParser<NumberFormatPart[]> {
    convert(matches: NamedMatch[]) {
        return matches.map((m, i) => ({type: m.name as NumberFormatPartTypes, value: m.value.toLocaleUpperCase(this.locale)}));
    }
}

export interface Parser<T> {
    parse(value: string): T;

    parseAll(value: string): T[];
}