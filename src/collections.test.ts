import {assert} from 'chai';
import {toArray, toPromiseArray} from "./collections";

export function assertSync<T>(actual: Iterable<T>, ...expected: T[]) {
    assert.deepEqual(toArray(actual), expected);
}

export async function assertAsync<T>(iterable: AsyncIterable<T>, ...expected: T[]) {
    assert.deepEqual(await toPromiseArray(iterable), expected);
}

export async function assertThrows<T>(iterable: Iterable<T>, error:any) {
    try {
        await toArray(iterable);
        assert(false, "Should have thrown")
    } catch (e) {
        assert.deepEqual(e, error);
    }
}

export async function assertAsyncThrows<T>(iterable: AsyncIterable<T>, error:any) {
    try {
        await toPromiseArray(iterable);
        assert(false, "Should have thrown")
    } catch (e) {
        assert.deepEqual(e, error);
    }
}