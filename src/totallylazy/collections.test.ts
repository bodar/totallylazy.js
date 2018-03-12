import {assert} from 'chai';
import {toArray, toPromiseArray} from "./collections";

export function assertSync<T>(actual: Iterable<T>, ...expected: T[]) {
    assert.deepEqual(toArray(actual), expected);
}

export async function assertAsync<T>(iterable: AsyncIterable<T>, ...expected: T[]) {
    assert.deepEqual(await toPromiseArray(iterable), expected);
}