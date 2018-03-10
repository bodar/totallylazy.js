import {assert} from 'chai';
import {
    transducer, sum, asyncArray, iterate, increment, repeat, async_, syncArray, identity,
    IdentityTransducer, MapTransducer, FilterTransducer, ScanTransducer, TakeTransducer, range
} from "./transducers";


describe("transducers", () => {
    it("can map", async () => {
        return assertSync(transducer<number>().map(n => n.toString()).sync([2]), "2");
    });

    it("can filter", async () => {
        return assertSync(transducer<number>().filter(n => n % 2 == 0).sync([0, 1, 2, 3, 4]), 0, 2, 4);
    });

    it("can scan", async () => {
        return assertSync(transducer<number>().scan(sum).sync([0, 2, 4]), 0, 2, 6);
    });

    it("can take", async () => {
        return assertSync(transducer<number>().take(4).sync([0, 1, 2, 3, 4, 5, 6, 7, 8]), 0, 1, 2, 3);
    });

    it("can take while", async () => {
        return assertSync(transducer<number>().takeWhile(n => n < 4).sync([0, 1, 2, 3, 4, 5, 6, 7, 8]), 0, 1, 2, 3);
    });

    it("supports terminating early with take", async () => {
        let called = false;
        assertSync(transducer<number>().take(0).sync(repeat(() => {
            called = true;
            throw new Error();
        })));
        assert.equal(called, false);
    });

    it("can decompose transducers", async () => {
        const composite = transducer<number>().map(increment).filter(n => n % 2 == 0).scan(sum).take(4);
        const [identity, map, filter, scan, take] = composite.decompose();
        assert.instanceOf(identity, IdentityTransducer);
        assert.instanceOf(map, MapTransducer);
        assert.instanceOf(filter, FilterTransducer);
        assert.instanceOf(scan, ScanTransducer);
        assert.instanceOf(take, TakeTransducer);
    });

    it("supports ranges", () => {
        assertSync(range(1).take(3), 1, 2, 3);
        assertSync(range(1, 5), 1, 2, 3, 4, 5);
        assertSync(range(5, 1), 5, 4, 3, 2, 1);
        assertSync(range(1, 10, 2), 1, 3, 5, 7, 9);
    });

    function assertSync<T>(actual: Iterable<T>, ...expected: T[]) {
        assert.deepEqual(syncArray(actual), expected);
    }

    async function assertAsync<T>(iterable: AsyncIterable<T>, ...expected: T[]) {
        assert.deepEqual(await asyncArray(iterable), expected);
    }
});