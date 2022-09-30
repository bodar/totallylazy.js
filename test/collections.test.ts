import {assert} from 'chai';
import {AsyncIteratorHandler} from "../src/collections";
import {array} from "../src/array";


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

    it('can also return different type', async () => {
        const handler = new AsyncIteratorHandler<number, string>();
        const one = handler.next();
        const two = handler.next();
        const finished = handler.next();
        handler.value(1);
        assert.deepEqual((await one), {value: 1, done: false});
        handler.value(2);
        assert.deepEqual((await two), {value: 2, done: false});
        handler.close('RETURN');
        assert.deepEqual((await finished), {value: 'RETURN', done: true});
    });
});


