import {assert} from 'chai';
import {format, money, parse} from "../../src/money/money";
import NumberFormatPart = Intl.NumberFormatPart;
import {locales} from "../dates/dates.test";

export const numberLocales = Intl.NumberFormat.supportedLocalesOf(locales);
const currencies = ["AED","ANG","AUD","CHE","CHF","CHW","EUR","GBP","HKD","HNL","HTG","HUF","IDR","ILS","INR","IQD","IRR","ISK","JMD","JOD","JPY","KES","KGS","KPW","KRW","KWD","KZT","LAK","LBP","LKR","LRD","LSL","LYD","MAD","MDL","MGA","MKD","MMK","MNT","MOP","MRU","MUR","MVR","MWK","MXN","MXV","MYR","MZN","NAD","NGN","NIO","NOK","NPR","NZD","OMR","PAB","PEN","PGK","PHP","PKR","PLN","PYG","QAR","RON","RSD","RUB","RWF","SAR","SBD","SCR","SDG","SEK","SGD","SHP","SLL","SOS","SRD","SSP","STN","SYP","SZL","THB","TJS","TMT","TND","TOP","TRY","TTD","TWD","TZS","UAH","UGX","USD","USN","UYI","UYU","UYW","UZS","VES","VND","VUV","WST","XAG","XAU","XBA","XBB","XBC","XBD","XCD","XDR","XOF","XPD","XPF","XPT","XSU","XTS","XUA","XXX","YER","ZAR","ZMW","ZWL"];
const broken  = ['IQD', 'IRR', 'ISK', 'JPY', 'KPW', 'KRW', 'LAK', 'LBP', 'MGA', 'MMK', 'PYG', 'RSD', 'RWF', 'SLL', 'SOS', 'SYP', 'UGX', 'UYI', 'VND', 'VUV', 'XOF', 'XPF', 'YER'];
const amounts = [1234567.89, 156, 156.89, .12];

describe("Money", function () {
    this.timeout(10000);

    const groupDelimetersFound = [',', '.', ' ', '’', ' '];
    // Contains narrow non breaking space - 8239

    it.skip('can parse money', () => {
        for (const locale of numberLocales) {
            for (const currency of currencies.filter(c => !broken.includes(c))) {
                for (const amount of amounts) {
                    const m = money(currency, amount);
                    const f = format(m, locale);
                    const s = format(m, locale, "symbol");
                    const parsed = parse(f, locale);
                    assert.deepEqual(parsed, m);
                }
            }
        }
    });

    it('can convert parts to money', () => {
        const isoParts: NumberFormatPart[] = [{type: 'currency', value: 'EUR'},
            {type: 'literal', value: ' '},
            {type: 'integer', value: '1'},
            {type: 'group', value: ','},
            {type: 'integer', value: '234'},
            {type: 'group', value: ','},
            {type: 'integer', value: '567'},
            {type: 'decimal', value: '.'},
            {type: 'fraction', value: '89'}];

        assert.deepEqual(money(isoParts), money('EUR', 1234567.89));
    });
});



