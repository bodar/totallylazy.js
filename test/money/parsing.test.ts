import {assert} from 'chai';
import {CurrencySymbols, format, money, moneyFrom, parse, parser, partsFrom} from "../../src/money/money";
import {locales} from "../dates/dates.test";
import {currencies} from "../../src/money/currencies";
import {runningInNode} from "../../src/node";
import NumberFormatPart = Intl.NumberFormatPart;
import {Datum, prefer, MatchStrategy, uniqueMatch} from "../../src/parsing";

export const numberLocales = Intl.NumberFormat.supportedLocalesOf(locales);
const amounts = [1234567.89, 156, 156.89, .1234, 0];

describe("Money", function () {
    this.timeout(10000);

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

        assert.deepEqual(moneyFrom(isoParts), money('EUR', 1234567.89));
    });

    it('can convert money to parts', () => {
        assert.deepEqual(partsFrom(money('EUR', 1234567.89)), [{type: 'currency', value: 'EUR'},
            {type: 'literal', value: ' '},
            {type: 'integer', value: '1'},
            {type: 'group', value: ','},
            {type: 'integer', value: '234'},
            {type: 'group', value: ','},
            {type: 'integer', value: '567'},
            {type: 'decimal', value: '.'},
            {type: 'fraction', value: '89'}]);
    });

    it('can parse unambiguous real examples', () => {
        assert.deepEqual(parse('£157', 'en-GB'), money('GBP', 157));
        assert.deepEqual(parse('US$274', 'ko-KR'), money('USD', 274));
        assert.deepEqual(parse('274 US$', 'pt-PT'), money('USD', 274));
        assert.deepEqual(parse('CA$315', 'en-US'), money('CAD', 315));
        assert.deepEqual(parse('315 $CA', 'fr-FR'), money('CAD', 315));
    });

    it('can parse ambiguous real examples with a custom strategy???', () => {
        assert.deepEqual(parser('en', prefer('CNY')).parse('¥ 2890.30'), money('CNY', 2890.30));
        assert.deepEqual(parser('en', prefer('CNY')).parse('GBP 2890.30'), money('GBP', 2890.30));
        assert.deepEqual(parser('en', prefer('USD')).parse('$ 433.80'), money('USD', 433.80));
        assert.deepEqual(parser('en').parse('₩ 398526.56'), money('KRW', 398526.56));
        assert.deepEqual(parser('en').parse('KSh 34,202.20'), money('KES', 34202.20));
        assert.deepEqual(parser('en').parse('AED 1204.99'), money('AED', 1204.99));
        // assert.deepEqual(parser('en').parse('95065.22 Ft'), money('HUF', 95065.22));
    });

    it('can parse multiple monies in a string', function () {
        assert.deepEqual(parser('en').parseAll('Total: USD 100 Tax: USD 10'),
            [money('USD', 100), money('USD', 10)]);
    });

    it('ignores values that are very nearly valid money', function () {
        assert.deepEqual(parser('en').parseAll('Total: USD 100 Tax: USD 10 Nearly: DAN 10'),
            [money('USD', 100), money('USD', 10)]);
    });
});



describe("CurrencySymbols", function () {
    before(function () {
        if (runningInNode() && process.env.NODE_ICU_DATA != './node_modules/full-icu') {
            console.log("To run these tests you must set 'NODE_ICU_DATA=./node_modules/full-icu'");
            this.skip();
        }
    });

    it('is flexible in parsing as long as there is a unique match', () => {
        const fr = CurrencySymbols.get('fr-FR');
        assert.deepEqual(fr.parse('$CA'), 'CAD');
        assert.deepEqual(fr.parse('CAD'), 'CAD');
    });

    it('Yen symbol is ambiguous so throw', () => {
        const fr = CurrencySymbols.get('en');
        assert.throw(() => fr.parse('¥'));
    });

    it('can get pattern', () => {
        const en = CurrencySymbols.get('en');
        assert.deepEqual(en.pattern, '[$./ABCDEFGHIJKLMNOPQRSTUVWXYZgkprstuz¢£¤¥čłƒвл֏ألم৳฿៛₦₩₪₫€₲₴₹₺₼₽﷼]{1,4}');
        assert.deepEqual(new RegExp(en.pattern).test('$CA'), true);
    });

    it('can also parse the normal ISO code', () => {
        const ru = CurrencySymbols.get('ru');
        assert.deepEqual(ru.parse('USD'), 'USD');
    });
});



