"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferredCurrencies = void 0;
class PreferredCurrencies {
    /**
     * https://en.wikipedia.org/wiki/Dollar#Economies_that_use_a_dollar
     */
    static dollarSymbol(country) {
        return (country && PreferredCurrencies.dollarCountries[country]) || 'USD';
    }
    /**
     * https://en.wikipedia.org/wiki/Pound_(currency)#Countries_and_territories_currently_using_currencies_called_pounds
     */
    static poundSymbol(country) {
        return (country && PreferredCurrencies.poundCountries[country]) || 'GBP';
    }
    static yenSymbol(country) {
        return (country && PreferredCurrencies.yenCountries[country]) || 'JPY';
    }
    static kroneSymbol(country) {
        return (country && PreferredCurrencies.kroneCountries[country]) || 'DKK';
    }
    static rupeeSymbol(country) {
        return (country && PreferredCurrencies.rupeeCountries[country]) || 'INR';
    }
    static for(country) {
        return [
            PreferredCurrencies.dollarSymbol(country),
            PreferredCurrencies.poundSymbol(country),
            PreferredCurrencies.yenSymbol(country),
            PreferredCurrencies.kroneSymbol(country),
            PreferredCurrencies.rupeeSymbol(country)
        ];
    }
}
exports.PreferredCurrencies = PreferredCurrencies;
PreferredCurrencies.dollarCountries = {
    'AG': 'XCD',
    'AR': 'ARS',
    'AU': 'AUD',
    'BS': 'BSD',
    'BB': 'BBD',
    'BZ': 'BZD',
    'BM': 'BMD',
    'BN': 'BND',
    'CA': 'CAD',
    'CO': 'COP',
    'CL': 'CLP',
    'CU': 'CUP',
    'DM': 'XCD',
    'DO': 'DOP',
    'EC': 'USD',
    'FM': 'USD',
    'KY': 'KYD',
    'FJ': 'FJD',
    'GD': 'XCD',
    'GY': 'GYD',
    'HK': 'HKD',
    'JM': 'JMD',
    'KI': 'AUD',
    'KN': 'XCD',
    'LC': 'XCD',
    'LR': 'LRD',
    'MH': 'USD',
    'MX': 'MXN',
    'NA': 'NAD',
    'NZ': 'NZD',
    'SG': 'SGD',
    'SB': 'SBD',
    'SR': 'SRD',
    'SV': 'USD',
    'TL': 'USD',
    'TW': 'TWD',
    'TT': 'TTD',
    'TV': 'AUD',
    'US': 'USD',
    'UY': 'UYU',
    'VC': 'XCD',
    'ZW': 'USD',
};
PreferredCurrencies.poundCountries = {
    'EG': 'EGP',
    'FK': 'FKP',
    'GB': 'GBP',
    'GI': 'GIP',
    'GG': 'GBP',
    'IM': 'GBP',
    'JE': 'GBP',
    'LB': 'LBP',
    'SH': 'SHP',
    'SS': 'SSP',
    'SD': 'SDG',
    'SY': 'SYP',
};
PreferredCurrencies.yenCountries = {
    'CN': 'CNY',
    'JP': 'JPY',
};
PreferredCurrencies.kroneCountries = {
    'DK': 'DKK',
    'FO': 'DKK',
    'GL': 'DKK',
    'IS': 'ISK',
    'NO': 'NOK',
    'SE': 'SEK',
};
PreferredCurrencies.rupeeCountries = {
    'IN': 'INR',
    'ID': 'IDR',
    'MU': 'MUR',
    'NP': 'NPR',
    'PK': 'PKR',
    'LK': 'LKR',
};
//# sourceMappingURL=preferred-currencies.js.map