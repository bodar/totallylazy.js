import {assert} from 'chai';
import {money} from "../../src/money";
import {infer, prefer} from "../../src/parsing";
import {flexibleMoneyParser, flexibleParse, numberParser, NumberParser} from "../../src/money/flexible-parsing";


describe('NumberParser', () => {
    it('can parse a number', function () {
        assert.equal(numberParser('.').parse('1.23'), 1.23);
        assert.equal(numberParser(',').parse('1,23'), 1.23);
        assert.equal(numberParser('.').parse('1,234.56'), 1234.56);
        assert.equal(numberParser(',').parse('1.234,56'), 1234.56);
        assert.equal(numberParser(',').parse('1 234,56'), 1234.56);
        assert.equal(numberParser(',').parse('1’234,56'), 1234.56);
    });

    it('can parse all numbers in a string', function () {
        assert.deepEqual(numberParser(',').parseAll('Total 1 234,56 Tax 234,56'), [1234.56, 234.56]);
    });

    it('does not join adjacent numbers in a string ', function () {
        assert.deepEqual(numberParser(',').parseAll('1     2'), [1, 2]);
    });

    it('will not blow up with some invalid inputs but returns any valid', function () {
        assert.deepEqual(numberParser(',').parseAll('Total 1,2.3.5  Tax 234,56'), [234.56]);
    });

    it('does not parse gibberish', function () {
        assert.throws(() => numberParser('.').parse('1 and 23'));
    });

    it('does not parse if multiple decimal separators', function () {
        assert.throws(() => numberParser('.').parse('1.23.456'));
    });

    it('throws with inconsistent separators', () => {
        assert.throws(() => numberParser('.').parse("1,222’333.44"));
        assert.throws(() => numberParser('.').parse("1.222’333,44"));
        assert.throws(() => numberParser('.').parse("1.222’333.44"));
    });

    it('handles large numbers with multiple group separators', () => {
        assert.equal(numberParser('.').parse("1,234,568"), 1234568);
    });

    it('can parse arabic numerals', () => {
        assert.equal(numberParser('٫', 'ar-EG').parse("١٢٬٣٤٥٬٦٧٠٫٨٩"), 12345670.89);
    });
});

describe("Flexible Parsing", function () {
    it('can parse arabic numerals, separators and symbols', function () {
        assert.deepEqual(flexibleMoneyParser('ar-EG').parseAll( '١٢٬٣٤٥٬٦٧٠٫٨٩ ج.م.‏'), [money('EGP', 12345670.89)]);
    });

    it('ignores extra delimiters', function () {
        assert.deepEqual(flexibleMoneyParser().parseAll('221,38 EUR.'), [money('EUR', 221.38)]);
        assert.deepEqual(flexibleMoneyParser().parseAll('221,38 EUR,'), [money('EUR', 221.38)]);
    });

    it('still supports currencies with a delimiter that is part of the code', function () {
        assert.deepEqual(flexibleMoneyParser().parseAll('221,38 лв.'), [money('BGN', 221.38)]);
        assert.deepEqual(flexibleMoneyParser().parseAll('221,38 A.M.'), [money('AZN', 221.38)]);
        assert.deepEqual(flexibleMoneyParser('da-DK').parseAll('221,38 kr.'), [money('DKK', 221.38)]);
        assert.deepEqual(flexibleMoneyParser('fo-FO').parseAll('221,38 kr.'), [money('DKK', 221.38)]);
        assert.deepEqual(flexibleMoneyParser('kl-GL').parseAll('221,38 kr.'), [money('DKK', 221.38)]);
        assert.deepEqual(flexibleMoneyParser('is-IS').parseAll('221,38 kr.'), [money('ISK', 221.38)]);
        assert.deepEqual(flexibleMoneyParser('nn-NO').parseAll('221,38 kr.'), [money('NOK', 221.38)]);
        assert.deepEqual(flexibleMoneyParser('sv-SE').parseAll('221,38 kr.'), [money('SEK', 221.38)]);
    });

    it('should use exact match for currency code or symbol', function () {
        assert.deepEqual(flexibleMoneyParser().parseAll('23 m'), []);
        assert.deepEqual(flexibleMoneyParser().parseAll('23 M'), [money('LSL', 23)]);
    });

    it('do not use prefer strategy when explicit currency code is present', function () {
        assert.deepEqual(flexibleMoneyParser('en', {strategy: prefer('USD')}).parseAll('From $220 CAD'), [money('CAD', 220)]);
    });

    it('handles when there is a false match on the currency regex', function () {
        assert.deepEqual(flexibleMoneyParser().parseAll('From 1 234,56 USD'), [money('USD', 1234.56)]);
    });

    it('can parse all numbers in a string', function () {
        assert.deepEqual(flexibleMoneyParser().parseAll('Total USD 1 234,56 Tax USD 234,56'), [money('USD', 1234.56), money('USD', 234.56)]);
    });

    it('will not blow up with some invalid inputs but returns any valid', function () {
        assert.deepEqual(flexibleMoneyParser().parseAll('Total USD 1,2.3.5  Tax USD 234,56'), [money('USD', 234.56)]);
    });

    it('can parse when no group separators and decimal', () => {
        assert.deepEqual(flexibleParse('USD 1234'), money('USD', 1234));
        assert.deepEqual(flexibleParse('USD1234'), money('USD', 1234));
        assert.deepEqual(flexibleParse('1234 USD'), money('USD', 1234));
        assert.deepEqual(flexibleParse('1234USD'), money('USD', 1234));
    });

    it('supports the strategy for ambiguous currency', () => {
        assert.deepEqual(flexibleParse('$1234', 'en', {strategy: prefer('USD')}), money('USD', 1234));
    });

    it('can parse when we have both currency code and symbol', () => {
        assert.deepEqual(flexibleParse('AUD $12,000.00', 'en-AU'), money('AUD', 12000));
        assert.deepEqual(flexibleParse('AUD$ 12,000.00', 'en-AU'), money('AUD', 12000));
    });

    it('can parse when we have both group separators and decimal', () => {
        assert.deepEqual(flexibleParse('USD 1,234.56'), money('USD', 1234.56));
        assert.deepEqual(flexibleParse('USD 1.234,56'), money('USD', 1234.56));
        assert.deepEqual(flexibleParse('USD 1 234,56'), money('USD', 1234.56));
        assert.deepEqual(flexibleParse('USD 1’234,56'), money('USD', 1234.56));
    });

    it('can parse when we have both group separators and decimal with a 3 decimal place currency', () => {
        assert.deepEqual(flexibleParse('BHD 1,234.567'), money('BHD', 1234.567));
        assert.deepEqual(flexibleParse('BHD 1.234,567'), money('BHD', 1234.567));
        assert.deepEqual(flexibleParse('BHD 1 234,567'), money('BHD', 1234.567));
        assert.deepEqual(flexibleParse('BHD 1’234,567'), money('BHD', 1234.567));
    });

    it('can parse when we have no group separators but there are 2 digits after the decimal separator irrespective of the decimal places for the currency', () => {
        assert.deepEqual(flexibleParse('₩ 398526.56', undefined, {strategy: prefer('KRW')}), money('KRW', 398526.56));
    });

    it('can parse when we have just a group separator but with a 2 decimal place currency', () => {
        assert.deepEqual(flexibleParse('USD 1,234'), money('USD', 1234));
        assert.deepEqual(flexibleParse('USD 1.234'), money('USD', 1234));
        assert.deepEqual(flexibleParse('USD 1 234'), money('USD', 1234));
        assert.deepEqual(flexibleParse('USD 1’234'), money('USD', 1234));
    });

    it('can parse when we have just a group separator but with a 4 decimal place currency', () => {
        assert.deepEqual(flexibleParse('CLF 1,234'), money('CLF', 1234));
        assert.deepEqual(flexibleParse('CLF 1.234'), money('CLF', 1234));
        assert.deepEqual(flexibleParse('UYW 1 234'), money('UYW', 1234));
        assert.deepEqual(flexibleParse('UYW 1’234'), money('UYW', 1234));
    });

    it('can parse when we have just a decimal separator but with a 2 decimal place currency', () => {
        assert.deepEqual(flexibleParse('USD 12,34'), money('USD', 12.34));
        assert.deepEqual(flexibleParse('USD 12.34'), money('USD', 12.34));
    });

    it('can parse when we have just a decimal separator but with a 4 decimal place currency', () => {
        assert.deepEqual(flexibleParse('CLF 12,3456'), money('CLF', 12.3456));
        assert.deepEqual(flexibleParse('UYW 12.3456'), money('UYW', 12.3456));
    });

    it('throws with invalid decimal separators', () => {
        assert.throws(() => flexibleParse("USD 12’34"));
        assert.throws(() => flexibleParse('USD 12 34'));
    });

    it('throws with inconsistent separators decimal separators', () => {
        assert.throws(() => flexibleParse("USD 1,222’333.44"));
    });

    it('throws with ambiguous value when there are 3 digits after a single separator at the end', () => {
        assert.throws(() => flexibleParse('BHD 4.567'));
        assert.throws(() => flexibleParse('BHD 4,567'));
        assert.throws(() => flexibleParse('BHD 4,567'));
        assert.throws(() => flexibleParse('BHD 4,567'));
    });

    it('can parse ambiguous value if decimal separator is supplied for a 3 decimal place currency', () => {
        assert.deepEqual(flexibleParse('BHD 4,567', undefined, {decimalSeparator: ","}), money('BHD', 4.567));
    });

    it('can parse value with no decimal separator if it has multiple group separators', () => {
        assert.deepEqual(flexibleParse('USD 1,234,568'), money('USD', 1234568));
    });

    it('can handle currency that is 2 character country code and symbol with or without a locale', () => {
        assert.deepEqual(flexibleParse('1000 $US', 'fr-FR'), money('USD', 1000));
        assert.deepEqual(flexibleParse('1000 $US'), money('USD', 1000));
    });

    it('only parses at the word boundary', () => {
        assert.deepEqual(flexibleMoneyParser('fr').parseAll('1© 2019 Wynn Resorts Holdings, LLC. '), []);
        assert.deepEqual(flexibleMoneyParser().parseAll('Last 1 room remaining'), []);
    });

    it('does not match any additional money when they adjoin', function () {
        assert.deepEqual(flexibleMoneyParser().parseAll('You save 11.40 EUR    102.60 EUR'),
            [money('EUR', 11.4), money('EUR', 102.6)]);

        assert.deepEqual(flexibleMoneyParser().parseAll('11.40 EUR 102.60 EUR'),
            [money('EUR', 11.4), money('EUR', 102.6)]);

        assert.deepEqual(flexibleMoneyParser().parseAll('EUR 11.40    EUR 102.60'),
            [money('EUR', 11.4), money('EUR', 102.6)]);
    });


});