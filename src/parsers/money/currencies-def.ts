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
    {iso: 'INR', symbol: 'Rs'},
    {iso: 'INR', symbol: '₹'},
    {iso: 'PKR', symbol: 'Rs'},
    {iso: 'LKR', symbol: 'Rs'},
    {iso: 'LKR', symbol: 'රු'},
    {iso: 'LKR', symbol: 'ரூ'},
    {iso: 'IDR', symbol: 'Rp'},
    {iso: 'IDR', symbol: 'Rs'},
    {iso: 'NPR', symbol: 'रु'},
    {iso: 'NPR', symbol: '₨'},
    {iso: 'NPR', symbol: 'Re'},
    {iso: 'MZN', symbol: 'MT'},
    {iso: 'MZN', symbol: 'MTn'},
    {iso: 'AED', symbol: 'د.إ'},
    {iso: 'AED', symbol: 'DH'},
    {iso: 'AED', symbol: 'Dhs'},
];