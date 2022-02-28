import { NamedMatch } from "../characters";
import { Datum, DatumLookup, MatchStrategy, Parser } from "../parsing";
import { Currencies, Currency } from "./currencies-def";
import NumberFormatPart = Intl.NumberFormatPart;
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
export declare function money(currency: string, amount: number): Money;
export declare function moneyFrom(parts: NumberFormatPart[], locale: string, options?: Options): Money;
export declare type CurrencyDisplay = 'symbol' | 'code';
export declare function decimalsFor(code: keyof Currencies): number;
export declare class Formatter {
    static create(currency: string, locale: string, currencyDisplay?: CurrencyDisplay): Intl.NumberFormat;
}
export declare const hasNativeToParts: boolean;
export declare function partsFrom(money: Money, locale: string, currencyDisplay?: CurrencyDisplay, hasNative?: boolean): NumberFormatPart[];
export declare function format(money: Money, locale: string, currencyDisplay?: CurrencyDisplay): string;
export declare function toPartsPonyfill(actual: Money, locale: string, currencyDisplay?: CurrencyDisplay): NumberFormatPart[];
export declare class FormatToParts {
    private currency;
    private currencyDisplay;
    private parser;
    private locale;
    constructor(currency: string, currencyDisplay: CurrencyDisplay, parser: Parser<NumberFormatPart[]>, locale: string);
    static create(currency: string, locale: string, currencyDisplay?: CurrencyDisplay): FormatToParts;
    format(amount: number): Intl.NumberFormatPart[];
}
export declare function parse(value: string, locale: string, options?: Options): Money;
export declare function parser(locale: string, options?: Options): Parser<Money>;
export declare function parseToParts(value: string, locale: string, options?: Options): NumberFormatPart[];
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
export declare type Format = string;
export interface Options {
    strategy?: MatchStrategy<string>;
    format?: Format;
    strict?: boolean;
}
export declare type CurrencySymbolDatum = Datum<string>;
export declare class CurrencySymbols extends DatumLookup<string> {
    private locale;
    static cache: {
        [key: string]: CurrencySymbols;
    };
    constructor(data: Datum<string>[], locale: string);
    static get(locale: string, additionalData?: CurrencySymbolDatum[]): CurrencySymbols;
    static set(locale: string, months: CurrencySymbols): CurrencySymbols;
    static create(locale: string, additionalData?: CurrencySymbolDatum[]): CurrencySymbols;
    static generateData(locale: string): CurrencySymbolDatum[];
    static generateAdditionalSymbols: string[];
    static dataFor(locale: string, iso: string, currency: Currency): CurrencySymbolDatum[];
    parse(value: string, strategy?: MatchStrategy<string>): string;
}
export declare function symbolFor(locale: string, isoCurrency: string, hasNative?: boolean): string;
export declare class RegexBuilder {
    static buildFromOptions(locale: string, options?: Options): string;
    static buildPattern(locale: string, strict?: boolean): string;
    static buildFrom(raw: NumberFormatPart[], locale: string, strict?: boolean): string;
    static buildParts(raw: Intl.NumberFormatPart[], strict?: boolean): NumberFormatPart[];
}
export declare class MoneyParser {
    static create(locale: string, options?: Options): Parser<Money>;
}
export declare class NumberFormatPartParser {
    static create(locale: string, pattern?: string): Parser<NumberFormatPart[]>;
    static create(locale: string, options?: Options): Parser<NumberFormatPart[]>;
    static convert(matches: NamedMatch[], locale: string): NumberFormatPart[];
}
export declare class PartsFromFormat {
    private formatRegex;
    private integerGroupParser;
    private constructor();
    parse(format: string): NumberFormatPart[];
    static get format(): PartsFromFormat;
    static examplePattern(locale: string): PartsFromFormat;
}
export declare class IntegerGroupParser {
    private regex;
    private constructor();
    parse(value: string): NumberFormatPart[];
    static digits(locale: string): IntegerGroupParser;
    static get integerFormat(): IntegerGroupParser;
}
