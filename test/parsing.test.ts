import {CachingParser, digits, Numerals, Parser} from "../src/parsing";
import {assert} from 'chai';
import {characters} from "../src/characters";
import {zip} from "../src/transducers";
import {sequence} from "../src/sequence";

describe('CachingParser', () => {
    it('only calls the underlying parser once per value', () => {
        class CountingParser implements Parser<number> {
            private count: number = 0;
            parse(value: string): number {
                return ++this.count;
            }
            parseAll(value: string): number[] {
                return [++this.count];
            }
        }
        const cachingParser = new CachingParser(new CountingParser());

        assert.equal(cachingParser.parse('foo'), 1);
        assert.equal(cachingParser.parse('foo'), 1);
        assert.equal(cachingParser.parse('bar'), 2);
    });
});

describe('Numerals', () => {
    it('should handle arabic numerals', function () {
        const locale = 'ar-EG';
        for (const [character, number] of sequence(characters('١٢٣٤٥٦٧٨٩٠'), zip([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]))) {
            assert.equal(Numerals.get(locale).parse(character), number);
        }
    });

    it('should handle western numerals', function () {
        const locale = 'en';
        for (const number of [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]) {
            assert.equal(Numerals.get(locale).parse(number.toString()), number);
        }
    });
})


describe('digits', () => {
    it('works', function () {
        assert.equal(digits('fr'), '\\d0123456789')
    });
})