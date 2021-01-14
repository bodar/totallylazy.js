import {PreferredCurrencies} from "./preferred-currencies";

export interface Currency {
    decimals: number;
    symbols: string[];
}

export interface Currencies {
    [code: string] : Currency;
}

export interface CurrencySymbol {
    iso: string;
    symbol: string
}

export const additionalSymbols: CurrencySymbol[] = [
    ...Object.entries(PreferredCurrencies.dollarCountries).map(([, iso]) => ({iso, symbol: '$'})),
    ...Object.entries(PreferredCurrencies.poundCountries).map(([, iso]) => ({iso, symbol: '£'})),
    ...Object.entries(PreferredCurrencies.yenCountries).flatMap(([, iso]) => ([{iso, symbol: '¥'}, {iso, symbol: '￥'}])),
    {iso: 'KES', symbol: 'KSh'},
    {iso: 'VND', symbol: 'đ'},
];