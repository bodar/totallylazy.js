import {currencies} from "./currencies";

export class PreferredCurrencies {

    /**
     * https://en.wikipedia.org/wiki/Dollar#Economies_that_use_a_dollar
     */
    static dollarSymbol(country?: string): string {
        const code = (() => {
            switch (country) {
                case 'AG':
                case 'DM':
                case 'GD':
                case 'KN':
                case 'LC':
                case 'VC':
                    return 'XCD';
                case 'KI':
                case 'TV':
                    return 'AUD';
                default:
                    return `${country}D`;
            }
        })();

        const currency = currencies[code];
        if (!currency) return 'USD';
        return code;
    }

    /**
     * https://en.wikipedia.org/wiki/Pound_(currency)#Countries_and_territories_currently_using_currencies_called_pounds
     */
    static poundSymbol(country?: string): string {
        const code = (() => {
            switch (country) {
                case 'SD':
                    return 'SDG';
                default:
                    return `${country}P`;
            }
        })();

        const currency = currencies[code];
        if (!currency) return 'GBP';
        return code;
    }

    static yenSymbol(country?: string): string {
        const code = (() => {
            switch (country) {
                default:
                    return `${country}Y`;
            }
        })();

        const currency = currencies[code];
        if (!currency) return 'JPY';
        return code;
    }

    static for(country?:string): string[] {
        return [PreferredCurrencies.dollarSymbol(country), PreferredCurrencies.poundSymbol(country), PreferredCurrencies.yenSymbol(country)];
    }
}


