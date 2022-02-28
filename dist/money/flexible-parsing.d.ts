import { Money } from "./money";
import { AllowedDecimalSeparators, MatchStrategy, Parser } from "../parsing";
export interface Options {
    strategy?: MatchStrategy<string>;
    decimalSeparator?: AllowedDecimalSeparators;
}
export declare function flexibleParse(value: string, locale?: string, options?: Options): Money;
export declare class FlexibleMoneyParser implements Parser<Money> {
    private locale;
    private options?;
    constructor(locale: string, options?: Options | undefined);
    private get pattern();
    private static patternFor;
    parse(value: string): Money;
    parseAll(value: string): Money[];
    private parseSingle;
}
export declare function flexibleMoneyParser(locale?: string, options?: Options): FlexibleMoneyParser;
export declare function findDecimalSeparator(isoCurrency: string, amount: string): AllowedDecimalSeparators;
export interface ImplicitMoneyParserOptions {
    currency: string;
    locale?: string;
    strategy?: MatchStrategy<string>;
}
export declare function implicitMoneyParser({ currency, locale, strategy }: ImplicitMoneyParserOptions): Parser<Money>;
