export interface Currency {
    decimals: number;
    symbols: string[];
}

export interface Currencies {
    [code: string] : Currency;
}