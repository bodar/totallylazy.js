import {assert} from 'chai';
import {Option, range, sequence, Sequence, Single} from "../src/sequence";
import {assertAsync, assertAsyncThrows, assertSync} from "./collections.test";
import {FilterTransducer, FirstTransducer, FlatMapTransducer, IdentityTransducer} from "../src/transducers";

describe("Sequence", () => {
    it("supports ranges", () => {
        assertSync(range(1).take(3), 1, 2, 3);
        assertSync(range(1, 5), 1, 2, 3, 4, 5);
        assertSync(range(5, 1), 5, 4, 3, 2, 1);
        assertSync(range(1, 10, 2), 1, 3, 5, 7, 9);
        assertSync(range(10, 1, 2), 10, 8, 6, 4, 2);
    });

    it("decomposition still works even when moving from Sequence to Option", () => {
        const value = sequence([1, 2, 3]).flatMap(n => sequence([n, n * 2])).find(n => n > 2);
        assert.instanceOf(value, Option);
        const [identity, flatMap, filter, first] = value.decompose();
        assert.instanceOf(identity, IdentityTransducer);
        assert.instanceOf(flatMap, FlatMapTransducer);
        assert.instanceOf(filter, FilterTransducer);
        assert.instanceOf(first, FirstTransducer);
    });

    it("supports flatMap", () => {
        assertSync(sequence([1, 2, 3]).flatMap(n => sequence([n, n * 2])), 1, 2, 2, 4, 3, 6);
    });

    it("operations terminate early", () => {
        assertSync(range(1).flatMap(n => sequence([n, n * 2])).take(6), 1, 2, 2, 4, 3, 6);
    });
});

describe("Single", () => {
    it("is PromiseLike", async () => {
        await assertAsync(Single.of((resolve) => resolve(2)).map(n => n.toString()), '2');
    });

    it("is PromiseLike and can return an error", async () => {
        await assertAsyncThrows(Single.of((ignore, reject) => reject("Error")).map(n => n.toString()), 'Error');
    });

});

describe("Option", () => {
    it("supports Option", () => {
        assertSync(Option.some(1).map(n => n.toString()), '1');
        assertSync(Option.none().map(n => n.toString()));
    });
});