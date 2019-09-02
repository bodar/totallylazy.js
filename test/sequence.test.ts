import {range, sequence} from "../src/sequence";
import {assertAsync, assertSync} from "./collections.test";
import {CompositeTransducer, drop, find, flatMap, FlatMapTransducer, take, windowed} from "../src/transducers";
import {assert} from 'chai';
import {array} from "../src/collections";

describe("Sequence", () => {
    it("supports ranges", () => {
        assertSync(sequence(range(1), take(3)), 1, 2, 3);
        assertSync(sequence(range(1, undefined, 2), take(3)), 1, 3, 5);
        assertSync(sequence(range(1, undefined, -1), take(3)), 1, 0, -1);
        assertSync(range(1, 5), 1, 2, 3, 4, 5);
        assertSync(range(5, 1), 5, 4, 3, 2, 1);
        assertSync(range(1, 10, 2), 1, 3, 5, 7, 9);
        assertSync(range(10, 1, 2), 10, 8, 6, 4, 2);
    });

    it("range throw is step is 0", () => {
        assert.throws(() => assertSync(range(1, undefined, 0)), Error, "step can not be 0");
    });

    it("decomposition works - WIP", () => {
        const value = sequence([1, 2, 3], flatMap(n => [n, n * 2]), find(n => n > 2));
        const [fmap, findT] = value.transducers;
        assert.instanceOf(fmap, FlatMapTransducer);
        assert.instanceOf(findT, CompositeTransducer);
    });

    it("supports flatMap", () => {
        assertSync(sequence([1, 2, 3], flatMap(n => [n, n * 2])), 1, 2, 2, 4, 3, 6);
    });

    it("operations terminate early", () => {
        assertSync(sequence(range(1), flatMap(n => [n, n * 2]), take(6)), 1, 2, 2, 4, 3, 6);
    });

    it("supports a sliding window on infinite sequence", function () {
        assert.deepEqual(array(range(1), windowed(3), take(3)), [[1, 2, 3], [2, 3, 4], [3, 4, 5]]);
    });

    it.skip("supports a sliding window on infinite sequence with custom step function", function () {
        assert.deepEqual(array(range(1), windowed(3, 2), take(3)), [[1, 2, 3], [3, 4, 5], [5, 6, 7]]);
    });


    it("supports async operations", async () => {
        async function *asyncRange(count = 0): AsyncIterable<number> {
            while(true) {
                yield count++;
            }
        }

        return assertAsync(sequence(asyncRange(1), flatMap((n: number) => [n, n * 2]), take(6)), 1, 2, 2, 4, 3, 6);
    });
});
