export declare class PreferredCurrencies {
    static dollarCountries: {
        [country: string]: string;
    };
    /**
     * https://en.wikipedia.org/wiki/Dollar#Economies_that_use_a_dollar
     */
    static dollarSymbol(country?: string): string;
    static poundCountries: {
        [country: string]: string;
    };
    /**
     * https://en.wikipedia.org/wiki/Pound_(currency)#Countries_and_territories_currently_using_currencies_called_pounds
     */
    static poundSymbol(country?: string): string;
    static yenCountries: {
        [country: string]: string;
    };
    static yenSymbol(country?: string): string;
    static kroneCountries: {
        [country: string]: string;
    };
    static kroneSymbol(country?: string): string;
    static rupeeCountries: {
        [country: string]: string;
    };
    static rupeeSymbol(country?: string): string;
    static for(country?: string): string[];
}
