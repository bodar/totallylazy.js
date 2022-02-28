import {asyncIterable, toIterable} from "../src/collections";
import {repeat} from "../src/sequence";
import {array} from "../src/array";
import {take} from "../src/transducers/take";
import {assertAsync, assertSync} from "./asserts";


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