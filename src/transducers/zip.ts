import {isAsyncIterable, isIterable} from "../collections";
import {range} from "../sequence";
import {Transducer} from "./transducer";

export class ZipTransducer<A, B> implements Transducer<A, [A, B]> {
    constructor(public other: Iterable<B> | AsyncIterable<B>) {
    }

    async* async_(iterable: AsyncIterable<A>): AsyncIterable<[A, B]> {
        if (!isAsyncIterable(this.other)) throw new Error("Unsupported operation exception");
        const iteratorA = iterable[Symbol.asyncIterator]();
        const iteratorB = this.other[Symbol.asyncIterator]();
        while (true) {
            const [resultA, resultB] = await Promise.all([iteratorA.next(), iteratorB.next()]);
            if (resultA.done || resultB.done) return;
            yield [resultA.value, resultB.value];
        }
    }

    * sync(iterable: Iterable<A>): Iterable<[A, B]> {
        if (!isIterable(this.other)) throw new Error("Unsupported operation exception");
        const iteratorA = iterable[Symbol.iterator]();
        const iteratorB = this.other[Symbol.iterator]();
        while (true) {
            const resultA = iteratorA.next(), resultB = iteratorB.next();
            if (resultA.done || resultB.done) return;
            yield [resultA.value, resultB.value];
        }
    }
}

export function zip<A, B>(other: Iterable<B> | AsyncIterable<B>): ZipTransducer<A, B> {
    return new ZipTransducer(other);
}

export function zipWithIndex<A>(): ZipTransducer<A, number> {
    return new ZipTransducer(range(0));
}