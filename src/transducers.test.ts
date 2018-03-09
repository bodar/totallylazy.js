import {assert} from 'chai';
import {transducer, sum, asyncArray, iterate, increment, repeat, async_, syncArray} from "./transducers";


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

    it("supports terminating early with take", async () => {
        let called = false;
        assertSync(transducer<number>().take(0).sync(repeat(() => {
            called = true;
            throw new Error();
        })));
        assert.equal(called, false);
    });

    function assertSync<T>(actual: Iterable<T>, ...expected: T[]) {
        assert.deepEqual(syncArray(actual), expected);
    }
    async function assertAsync<T>(iterable: AsyncIterable<T>, ...expected: T[]) {
        assert.deepEqual(await asyncArray(iterable), expected);
    }
});