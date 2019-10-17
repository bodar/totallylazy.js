import { assert } from 'chai';
import {caching} from "../src/cache";

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
});