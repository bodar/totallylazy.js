import {assert} from 'chai';
import {
    FilterTransducer,
    IdentityTransducer,
    intoArray,
    MapTransducer,
    ScanTransducer,
    TakeTransducer,
    transducer
} from "../src/transducers";
import {repeat} from "../src/sequence";
import {increment, sum} from "../src/numbers";
import {assertSync} from "./collections.test";
import {ascending, by, descending} from "../src/collections";


describe("transducers", () => {
    it("can drop", () => {
        assertSync(transducer<number>().drop(2).transduce([1, 2, 3]), 3);
        assertSync(transducer<number>().drop(4).transduce([1, 2, 3]), ...[]);
    });

    it("can reverse", () => {
        assertSync(transducer<number>().reverse().transduce([1, 2, 3]), 3, 2, 1);
    });

    it("can zip", () => {
        assertSync(transducer<number>().zip(['a', 'b', 'c']).transduce([1, 2]), [1, 'a'], [2, 'b']);
    });

    it("can map", () => {
        assertSync(transducer<number>().map(n => n.toString()).transduce([2]), "2");
    });

    it("can filter", () => {
        assertSync(transducer<number>().filter(n => n % 2 == 0).transduce([0, 1, 2, 3, 4]), 0, 2, 4);
    });

    it("can reject", () => {
        assertSync(transducer<number>().reject(n => n % 2 == 0).transduce([0, 1, 2, 3, 4]), 1, 3);
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

    it("can chunk", () => {
        assertSync(transducer<number>().chunk(3).transduce([0, 1, 2, 3, 4, 5, 6]), [0, 1, 2], [3, 4, 5], [6]);
    });

    it("can partition by", () => {
        assertSync(transducer<number>().partitionBy((it) => it == 2).transduce([0, 1, 2, 2, 2, 4, 2, 6, 7]),
            [0, 1], [2, 2, 2], [4], [2], [6, 7]);
    });

    it("can take", () => {
        assertSync(transducer<number>().take(4).transduce([0, 1, 2, 3, 4, 5, 6, 7, 8]), 0, 1, 2, 3);
        assertSync(transducer<number>().take(4.5).transduce([0, 1, 2, 3, 4, 5, 6, 7, 8]), 0, 1, 2, 3);
        assertSync(transducer<number>().take(0).transduce([0, 1, 2, 3, 4, 5, 6, 7, 8]));
        assertSync(transducer<number>().take(-1).transduce([0, 1, 2, 3, 4, 5, 6, 7, 8]));
    });

    it("can take while", async () => {
        assertSync(transducer<number>().takeWhile(n => n < 4).transduce([0, 1, 2, 3, 4, 5, 6, 7, 8]), 0, 1, 2, 3);
    });

    it("can sort", async () => {
        assertSync(transducer<number>().sort().transduce([3, 4, 8, 1, 2, 0, 3, 2, 9]), 0, 1, 2, 2, 3, 3, 4, 8, 9);
        assertSync(transducer<number>().sort(ascending).transduce([3, 4, 8, 1, 2, 0, 3, 2, 9]), 0, 1, 2, 2, 3, 3, 4, 8, 9);
        assertSync(transducer<number>().sort(descending).transduce([3, 4, 8, 1, 2, 0, 3, 2, 9]), 9, 8, 4, 3, 3, 2, 2, 1, 0);
    });

    it("can sort by property of object", async () => {
        class Cat {
            constructor(public name: string, public age: number) {
            }
        }

        const freaky = new Cat('Freaky', 17);
        const fatty = new Cat('Fatty', 18);
        const cats = [freaky, fatty];

        assertSync(transducer<Cat>().sort(by('name')).transduce(cats), fatty, freaky);
        assertSync(transducer<Cat>().sort(by('name', ascending)).transduce(cats), fatty, freaky);
        assertSync(transducer<Cat>().sort(by('name', descending)).transduce(cats), freaky, fatty);
        assertSync(transducer<Cat>().sort(by('age')).transduce(cats), freaky, fatty);
        assertSync(transducer<Cat>().sort(by('age', ascending)).transduce(cats), freaky, fatty);
        assertSync(transducer<Cat>().sort(by('age', descending)).transduce(cats), fatty, freaky);
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