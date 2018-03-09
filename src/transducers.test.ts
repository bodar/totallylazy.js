import {assert} from 'chai';
import {transducer, sum, toArray} from "./transducers";


describe("transducers", () => {
    it("can map", async () => {
        return assertResult(transducer<number>().map(n => n.toString()).call(2), "2");
    });

    it("can filter", async () => {
        return assertResult(transducer<number>().filter(n => n % 2 == 0).call(0, 1, 2, 3, 4), 0, 2, 4);
    });

    it("can scan", async () => {
        return assertResult(transducer<number>().scan(sum).call(0, 2, 4), 0, 2, 6);
    });

    async function assertResult<T>(iterable: AsyncIterable<T>, ...expected: T[]) {
        assert.deepEqual(await toArray(iterable), expected);
    }
});