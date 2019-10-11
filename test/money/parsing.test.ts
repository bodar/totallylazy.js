import {assert} from 'chai';
import {
    CurrencySymbols,
    format, Formatter, formatToPartsPonyfill,
    money,
    moneyFrom,
    parse,
    parser,
    partsFrom, PartsFromFormat, symbolFor,
} from "../../src/money";
import {locales} from "../dates/dates.test";
import {currencies} from "../../src/money/currencies";
import {runningInNode} from "../../src/node";
import {prefer} from "../../src/parsing";
import NumberFormatPart = Intl.NumberFormatPart;
import {Currency} from "../../src/money/currencies-def";

export const numberLocales = Intl.NumberFormat.supportedLocalesOf(locales);
const amounts = [1234567.89, 156, 156.89, .1234, 0];

describe("Money", function () {
    this.timeout(10000);

    it('symbolFor works when no native method is available', () => {
        for (const locale of numberLocales) {
            for (const code of Object.keys(currencies)) {
                const nonNative = symbolFor(locale, code, false);
                const native = symbolFor(locale, code, true);
                assert.equal(nonNative, native);
            }
        }
    });

    it('formatToPartsPonyfill', function () {
        assert.deepEqual(formatToPartsPonyfill(money('GBP', 123456.78), 'en'), [
            {type: 'currency', value: 'GBP'},
            {type: "literal", value: " "},
            {type: 'integer', value: '123'},
            {type: 'group', value: ','},
            {type: 'integer', value: '456'},
            {type: 'decimal', value: '.'},
            {type: 'fraction', value: '78'},
        ]);
    });

    it('can parse loads of money!', () => {
        for (const locale of numberLocales) {
            for (const [code, {decimals}] of currenciesWithDifferentDecimals) {
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

        assert.deepEqual(moneyFrom(isoParts, 'en'), money('EUR', 1234567.89));
    });

    it('can convert money to parts', () => {
        assert.deepEqual(partsFrom(money('EUR', 1234567.89), 'en'), [{type: 'currency', value: 'EUR'},
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

    it('currency symbol can be at back or front', () => {
        assert.deepEqual(parse('€1.234,56', 'de-DE'), money('EUR', 1234.56));
        assert.deepEqual(parse('1.234,56 €', 'de-DE'), money('EUR', 1234.56));
        assert.deepEqual(parse('EUR 1.234,56', 'de-DE'), money('EUR', 1234.56));
        assert.deepEqual(parse('1.234,56 EUR', 'de-DE'), money('EUR', 1234.56));
    });

    it('can parse ambiguous real examples with a custom strategy', () => {
        assert.deepEqual(parser('en', {strategy: prefer('CNY')}).parse('¥ 2890.30'), money('CNY', 2890.30));
        assert.deepEqual(parser('en', {strategy: prefer('CNY')}).parse('GBP 2890.30'), money('GBP', 2890.30));
        assert.deepEqual(parser('en', {strategy: prefer('USD')}).parse('$ 433.80'), money('USD', 433.80));
        const p = parser('en', {strategy: prefer('USD', 'CNY')});
        assert.deepEqual(p.parse('$ 433.80'), money('USD', 433.80));
        assert.deepEqual(p.parse('¥ 2890.30'), money('CNY', 2890.30));
        assert.deepEqual(parser('en').parse('₩ 398526.56'), money('KRW', 398526.56));
        assert.deepEqual(parser('en').parse('KSh 34,202.20'), money('KES', 34202.20));
        assert.deepEqual(parser('en').parse('AED 1204.99'), money('AED', 1204.99));

        // This is a weird hotchpotch of formats, semi english decimal with hungarian symbol
        // Hungarian would be 95 065,22 Ft
        // but english could be HUF 95,065.22
        assert.deepEqual(parser('en', {format: 'iii.fff CCC'}).parse('95065.22 Ft'), money('HUF', 95065.22));

        assert.deepEqual(parser('en', {format: 'iii.fff CCC'}).parse('80.40 GBP'), money('GBP', 80.40));
        assert.deepEqual(parser('en', {format: 'iii iii,ff CCC'}).parse('1' + String.fromCharCode(8239) + '025,00 EUR'), money('EUR', 1025.00));
        assert.deepEqual(parser('en', {format: 'i,i CCC'}).parse('550,000 IDR'), money('IDR', 550000));
    });

    it('can accept format strings directly in the parse method', () => {
        assert.deepEqual(parse('80.40 GBP', 'en', {format: 'iii.fff CCC'}), money('GBP', 80.40));
        assert.deepEqual(parse('1' + String.fromCharCode(8239) + '025,00 EUR', 'en', {format: 'iii iii,ff CCC'}), money('EUR', 1025.00));
        assert.deepEqual(parse('550,000 IDR', 'en', {format: 'i,i CCC'}), money('IDR', 550000));
    });

    it('treats all forms of space as the same including nbsp 160 & 8239', () => {
        const spaces = [32, 160, 8239];
        for (const space of spaces) {
            assert.deepEqual(parser('fr').parse(`1${String.fromCharCode(space)}025,00${String.fromCharCode(space)}EUR`), money('EUR', 1025.00));
        }
    });

    it('only parses at the word boundary', () => {
        assert.deepEqual(parser('fr').parseAll('1© 2019 Wynn Resorts Holdings, LLC. '), []);
        assert.deepEqual(parser('en').parseAll('Last 1 room remaining'), []);
    });

    it('does not match any additional money when they adjoin', function () {
         assert.deepEqual(parser('en').parseAll('You save 11.40 EUR    102.60 EUR'),
            [money('EUR', 11.4), money('EUR', 102.6)]);

        assert.deepEqual(parser('en').parseAll('11.40 EUR 102.60 EUR'),
            [money('EUR', 11.4), money('EUR', 102.6)]);

        assert.deepEqual(parser('en').parseAll('EUR 11.40    EUR 102.60'),
            [money('EUR', 11.4), money('EUR', 102.6)]);

        // Think this one would need a full grammar as currency is already non-greedy
        //
        // assert.deepEqual(parser('en').parseAll('EUR 11.40 EUR 102.60'),
        //     [money('EUR', 11.4), money('EUR', 102.6)]);
    });

    it('when a format string is provided automatically go into strict mode so the currency symbol has to be exactly where the user specifies', function () {
        assert.deepEqual(parser('en', {format: 'C i,i.f'}).parseAll('You save 11.40 EUR    102.60 EUR'),
            []);
    });

    it('can convert format string to parts', () => {
        const f = 'i,iii.fff CCC';

        const parts: NumberFormatPart[] = PartsFromFormat.format.parse(f);
        assert.deepEqual(parts, [
            {type: 'integer', value: 'i'},
            {type: "group", value: ','},
            {type: 'integer', value: 'iii'},
            {type: "decimal", value: '.'},
            {type: "fraction", value: 'fff'},
            {type: "literal", value: ' '},
            {type: "currency", value: 'CCC'},
        ] as NumberFormatPart[]);
    });


    it('can parse multiple monies in a string', function () {
        assert.deepEqual(parser('en').parseAll('Total: USD 100 Tax: USD 10'),
            [money('USD', 100), money('USD', 10)]);
    });

    it('ignores values that are very nearly valid money', function () {
        assert.deepEqual(parser('en').parseAll('Total: USD 100 Tax: USD 10 Nearly: DAN 10'),
            [money('USD', 100), money('USD', 10)]);
    });

    it('has ponyfill for formatToParts', () => {
        for (const locale of numberLocales.filter(l => l != 'hy-Latn-IT-arevela')) {
            for (const [code] of currenciesWithDifferentDecimals) {
                for (const amount of amounts) {
                    const original = money(code, amount);
                    const formatter = Formatter.create(original.currency, locale);
                    const ponyResult = formatToPartsPonyfill(original, locale);
                    const nativeResult = formatter.formatToParts(original.amount);
                    assert.deepEqual(ponyResult, nativeResult);
                }
            }
        }
    });
});

export const currenciesWithDifferentDecimals: [string, Currency][] = Object.values(Object.entries(currencies).reduce((a, [code, currency]) => {
    a[currency.decimals] = [code, currency];
    return a;
}, {} as any));

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
        assert.deepEqual(new RegExp(en.pattern).test('$CA'), true);
    });

    it('can also parse the normal ISO code', () => {
        const ru = CurrencySymbols.get('ru');
        assert.deepEqual(ru.parse('USD'), 'USD');
    });
});



