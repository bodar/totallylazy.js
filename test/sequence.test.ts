import {sequence, range} from "../src/sequence";
import {assertSync} from "./collections.test";
import {
    CompositeTransducer,
    FilterTransducer,
    find,
    FirstTransducer,
    flatMap,
    FlatMapTransducer,
    IdentityTransducer,
    take
} from "../src/transducers";
import {assert} from 'chai';

describe("Sequence", () => {
    it("supports ranges", () => {
        assertSync(sequence(range(1), take(3)), 1, 2, 3);
        assertSync(range(1, 5), 1, 2, 3, 4, 5);
        assertSync(range(5, 1), 5, 4, 3, 2, 1);
        assertSync(range(1, 10, 2), 1, 3, 5, 7, 9);
        assertSync(range(10, 1, 2), 10, 8, 6, 4, 2);
    });

    it("decomposition still works even when moving from Sequence to Option", () => {
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
});
