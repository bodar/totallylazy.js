export class PreferredCurrencies {

    static dollarCountries: { [country: string]: string } = {
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
        'VC': 'XCD',
        'ZW': 'USD',
    };

    /**
     * https://en.wikipedia.org/wiki/Dollar#Economies_that_use_a_dollar
     */
    static dollarSymbol(country?: string): string {
        return (country && PreferredCurrencies.dollarCountries[country]) || 'USD';
    }

    static poundCountries: { [country: string]: string } = {
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

    /**
     * https://en.wikipedia.org/wiki/Pound_(currency)#Countries_and_territories_currently_using_currencies_called_pounds
     */
    static poundSymbol(country?: string): string {
        return (country && PreferredCurrencies.poundCountries[country]) || 'GBP';
    }

    static yenCountries: { [country: string]: string } = {
        'CN': 'CNY',
        'JP': 'JPY',
    };

    static yenSymbol(country?: string): string {
        return (country && PreferredCurrencies.yenCountries[country]) || 'JPY';
    }

    static kroneCountries: { [country: string]: string } = {
        'DK': 'DKK',
        'FO': 'DKK',
        'GL': 'DKK',
        'IS': 'ISK',
        'NO': 'NOK',
        'SE': 'SEK',
    };

    static kroneSymbol(country?: string): string {
        return (country && PreferredCurrencies.kroneCountries[country]) || 'DKK';
    }

    static rupeeCountries: { [country: string]: string } = {
        'IN': 'INR',
        'ID': 'IDR',
        'MU': 'MUR',
        'NP': 'NPR',
        'PK': 'PKR',
        'LK': 'LKR',
    };

    static rupeeSymbol(country?: string): string {
        return (country && PreferredCurrencies.rupeeCountries[country]) || 'INR';
    }

    static for(country?: string): string[] {
        return [
            PreferredCurrencies.dollarSymbol(country),
            PreferredCurrencies.poundSymbol(country),
            PreferredCurrencies.yenSymbol(country),
            PreferredCurrencies.kroneSymbol(country),
            PreferredCurrencies.rupeeSymbol(country)
        ];
    }
}


