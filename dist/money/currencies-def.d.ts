export interface Currency {
    decimals: number;
    symbols: string[];
}
export interface Currencies {
    [code: string]: Currency;
}
export interface CurrencySymbol {
    iso: string;
    symbol: string;
}
export declare const additionalSymbols: CurrencySymbol[];
