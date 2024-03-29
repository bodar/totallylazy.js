import {range, sequence} from "../src/sequence";
import {assert} from 'chai';
import {sum} from "../src/numbers";
import {single} from "../src/transducers/single";
import {first} from "../src/transducers/first";
import {last} from "../src/transducers/last";
import {flatMap, FlatMapTransducer} from "../src/transducers/flatMap";
import {filter} from "../src/transducers/filter";
import {find} from "../src/transducers/find";
import {CompositeTransducer} from "../src/transducers/compose";
import {take} from "../src/transducers/take";
import {reduce} from "../src/transducers/reduce";
import {assertAsync, assertSync} from "./asserts";

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

    it("can get a single value out", () => {
        assert.equal(single(range(1), filter((n:number) => n % 2 == 0), first()), 2);
        assert.equal(single(range(1, 10), filter((n:number) => n % 2 == 0), last()), 10);
        assert.equal(single([], reduce(sum, 0)), 0);
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
