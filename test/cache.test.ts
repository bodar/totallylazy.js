import { assert } from 'chai';
import {cache, caching} from "../src/cache";

describe('cache', () => {
    it('only calls the underlying function once per value', () => {
        let count = 0;

        class Foo {
            @cache add(a: number, b: number) {
                count++;
                return a + b;
            }
        }

        const foo = new Foo();

        foo.add(1,2);
        assert.equal(count, 1);
        foo.add(1,2);
        assert.equal(count, 1);
        foo.add(1,3);
        assert.equal(count, 2);
    });

    it('also works if the function returns something falsy', () => {
        let count = 0;
        class Foo {
            @cache add(a: number, b: number) {
                count++;
                return false;
            }
        }

        const foo = new Foo();

        foo.add(1,2);
        assert.equal(count, 1);
        foo.add(1,2);
        assert.equal(count, 1);
        foo.add(1,3);
        assert.equal(count, 2);
    });

    it('also works if the function returns undefined', () => {
        let count = 0;
        class Foo {
            @cache add(a: number, b: number) {
                count++;
                return undefined;
            }
        }

        const foo = new Foo();

        foo.add(1,2);
        assert.equal(count, 1);
        foo.add(1,2);
        assert.equal(count, 1);
        foo.add(1,3);
        assert.equal(count, 2);
    });
});


describe('caching', () => {
    it('only calls the underlying function once per value', () => {
        let count = 0;
        const cachingFN = caching((a:number, b:number) => {
            count++;
            return a + b;
        });

        cachingFN(1,2);
        assert.equal(count, 1);
        cachingFN(1,2);
        assert.equal(count, 1);
        cachingFN(1,3);
        assert.equal(count, 2);
    });

    it('also works if the function returns something falsy', () => {
        let count = 0;
        const cachingFN = caching((a:number, b:number) => {
            count++;
            return false;
        });

        cachingFN(1,2);
        assert.equal(count, 1);
        cachingFN(1,2);
        assert.equal(count, 1);
        cachingFN(1,3);
        assert.equal(count, 2);
    });

    it('also works if the function returns undefined', () => {
        let count = 0;
        const cachingFN = caching((a:number, b:number) => {
            count++;
            return undefined;
        });

        cachingFN(1,2);
        assert.equal(count, 1);
        cachingFN(1,2);
        assert.equal(count, 1);
        cachingFN(1,3);
        assert.equal(count, 2);
    });
});