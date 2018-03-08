import {assert} from 'chai';
import {identity, sum} from "./transducers";


describe("transducers", () => {
    it("can map", async () => {
        const transducer = identity<number>().map(n => n.toString());
        return assertResult(transducer.call(toIterable(2)), "2");
    });

    it("can scan", async () => {
        const transducer = identity<number>().scan(sum);
        return assertResult(transducer.call(toIterable(0, 2, 4)), 0, 2, 6);
    });

    async function assertResult<T>(iterable: AsyncIterable<T>, ...expected: T[]) {
        assert.deepEqual(await toArray(iterable), expected);
    }

    async function* toIterable<T>(...t: T[]): AsyncIterable<T> {
        yield* t;
    }

    async function toArray<T>(iterable: AsyncIterable<T>): Promise<T[]> {
        const result: T[] = [];
        for await (const value of iterable) result.push(value);
        return result;
    }
});