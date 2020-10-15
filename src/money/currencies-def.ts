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
    {iso: 'KES', symbol: 'KSh'},
    {iso: 'HKD', symbol: '$'},
    {iso: 'AUD', symbol: '$'},
];