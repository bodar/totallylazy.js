import {assert} from 'chai';
import {money, parse} from "../../src/money/money";
import NumberFormatPart = Intl.NumberFormatPart;

describe("Money", function () {

    it('can parse money', () => {
        const locale = 'en-GB';
        const parsed = parse('EUR 1,234,567.89', locale);
        assert.deepEqual(parsed, money('EUR', 1234567.89));
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

