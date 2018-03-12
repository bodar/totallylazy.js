import {assert} from 'chai';
import {
    transducer, IdentityTransducer, MapTransducer, FilterTransducer, ScanTransducer, TakeTransducer, intoArray} from "./transducers";
import {Option, range, repeat, sequence, Sequence, Single} from "./sequence";
import {increment, sum} from "./numbers";
import {toPromiseArray, toArray} from "./collections";
import {assertSync} from "./collections.test";


describe("transducers", () => {
    it("can map", () => {
        assertSync(transducer<number>().map(n => n.toString()).transduce([2]), "2");
    });

    it("can filter", () => {
        assertSync(transducer<number>().filter(n => n % 2 == 0).transduce([0, 1, 2, 3, 4]), 0, 2, 4);
    });

    it("supports first", () => {
        assertSync(transducer<number>().first().transduce([]));
        assertSync(transducer<number>().first().transduce([0, 1, 2, 3, 4]), 0);
    });

    it("supports last", () => {
        assertSync(transducer<number>().last().transduce([]));
        assertSync(transducer<number>().last().transduce([0, 1, 2, 3, 4]), 4);
    });

    it("can find", () => {
        assertSync(transducer<number>().find(n => n > 2).transduce([0, 1, 2, 3, 4]), 3);
        assertSync(transducer<number>().find(n => n > 2).transduce([]));
    });

    it("can scan", () => {
        assertSync(transducer<number>().scan(sum).transduce([0, 2, 4]), 0, 2, 6);
    });

    it("can reduce", () => {
        assertSync(transducer<number>().reduce(sum).transduce([0, 2, 4]), 6);
    });

    it("can reduce to array", () => {
        assertSync(transducer<number>().reduce(intoArray<number>()).transduce([0, 2, 4]), [0, 2, 4]);
    });

    it("can take", () => {
        assertSync(transducer<number>().take(4).transduce([0, 1, 2, 3, 4, 5, 6, 7, 8]), 0, 1, 2, 3);
    });

    it("can take while", async () => {
        assertSync(transducer<number>().takeWhile(n => n < 4).transduce([0, 1, 2, 3, 4, 5, 6, 7, 8]), 0, 1, 2, 3);
    });

    it("supports terminating early with take", async () => {
        let called = false;
        assertSync(transducer<number>().take(0).transduce(repeat(() => {
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
});