import {assert} from 'chai';
import {identity, sum, toArray} from "./transducers";


describe("transducers", () => {
    it("can map", async () => {
        const transducer = identity<number>().map(n => n.toString());
        return assertResult(transducer.call(2), "2");
    });

    it("can filter", async () => {
        const transducer = identity<number>().filter(n => n % 2 == 0);
        return assertResult(transducer.call(0, 1, 2, 3, 4), 0, 2, 4);
    });

    it("can scan", async () => {
        const transducer = identity<number>().scan(sum);
        return assertResult(transducer.call(0, 2, 4), 0, 2, 6);
    });

    async function assertResult<T>(iterable: AsyncIterable<T>, ...expected: T[]) {
        assert.deepEqual(await toArray(iterable), expected);
    }


});