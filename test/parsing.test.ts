import { caching, CachingParser, Parser } from "../src/parsing";
import { assert } from 'chai';

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
    const cachingParser = caching(new CountingParser());

    assert.equal(cachingParser.parse('foo'), 1);
    assert.equal(cachingParser.parse('foo'), 1);
    assert.equal(cachingParser.parse('bar'), 2);
  });
});