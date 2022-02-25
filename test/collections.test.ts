import {assert} from 'chai';
import {asyncIterable, AsyncIteratorHandler, toIterable} from "../src/collections";
import {repeat} from "../src/sequence";
import {array} from "../src/array";
import {take} from "../src/transducers/take";

export function assertSync<T>(actual: Iterable<T>, ...expected: T[]) {
    assert.deepEqual(array(actual), expected);
}

export async function assertAsync<T>(iterable: AsyncIterable<T>, ...expected: T[]) {
    assert.deepEqual(await array(iterable), expected);
}

export async function assertThrows<T>(iterable: Iterable<T>, error: any) {
    try {
        await array(iterable);
        assert(false, "Should have thrown")
    } catch (e) {
        assert.deepEqual(e, error);
    }
}

export async function assertAsyncThrows<T>(iterable: AsyncIterable<T>, error: any) {
    try {
        await array(iterable);
        assert(false, "Should have thrown")
    } catch (e) {
        assert.deepEqual(e, error);
    }
}

describe("array", () => {
    it("can iterate over something that is array like", () => {
        const foo: ArrayLike<string> = {
            length: 1,
            [0]: 'bar',
        }
        assertSync(array(foo), 'bar');
    });

    const a: Array<Promise<number>> = array(repeat(async () => 1), take(4));

    it('can convert an array of promises into an async iterable', async () => {
        await assertAsync(asyncIterable(a), 1, 1, 1, 1);
    });

    it('can force a sync array into an async iterable', async () => {
        await assertAsync(asyncIterable([1, 1, Promise.resolve(1), 1]), 1, 1, 1, 1);
    });

    it('can force a sync iterable into an async iterable', async () => {
        await assertAsync(asyncIterable(toIterable<any>(1, 1, Promise.resolve(1), 1)), 1, 1, 1, 1);
    });

});

describe("AsyncIteratorHandler", function () {
    it('will queue up data until it is consumed', async () => {
        const handler = new AsyncIteratorHandler<number>();
        handler.value(1);
        handler.value(2);
        handler.close();

        assert.deepEqual(await array(handler), [1, 2]);
    });

    it('will wait until data is available', async () => {
        const handler = new AsyncIteratorHandler<number>();
        const one = handler.next();
        const two = handler.next();
        const finished = handler.next();
        handler.value(1);
        assert.deepEqual((await one), {value: 1, done: false});
        handler.value(2);
        assert.deepEqual((await two), {value: 2, done: false});
        handler.close();
        assert.deepEqual((await finished), {value: undefined, done: true});
    });
});


