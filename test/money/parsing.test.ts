import {assert} from 'chai';
import {format, money, parse} from "../../src/money/money";
import {locales} from "../dates/dates.test";
import NumberFormatPart = Intl.NumberFormatPart;
import {currencies} from "../../src/money/currencies";

export const numberLocales = Intl.NumberFormat.supportedLocalesOf(locales);
const amounts = [1234567.89, 156, 156.89, .1234, 0];

describe("Money", function () {
    this.timeout(10000);

    const groupDelimetersFound = [',', '.', ' ', '’', ' '];
    // Contains narrow non breaking space - 8239

    it('can parse money with currency symbol', () => {
        const m = money('GBP', 123.45);
        const locale = 'en-GB';
        const symbol = format(m, locale, "symbol");
        const parsed = parse(symbol, locale);
        assert.deepEqual(parsed, money('£', 123.45));
    });

    it('can parse loads of money!', () => {
        for (const locale of numberLocales) {
            for (const [code, {decimals}] of Object.entries(currencies)) {
                for (const amount of amounts) {
                    const original = money(code, amount);
                    const expected = money(code, Number(amount.toFixed(decimals)));
                    const formatted = format(original, locale);
                    const parsed = parse(formatted, locale);
                    assert.deepEqual(parsed, expected);
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



