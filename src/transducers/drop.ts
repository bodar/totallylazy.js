import {Transducer} from "./transducer";

export class DropTransducer<A> implements Transducer<A, A> {
    constructor(public count: number) {
        if (typeof count === "undefined") throw new Error('Count can not be undefined');
    }

    async* async_(iterable: AsyncIterable<A>): AsyncIterable<A> {
        for await (const a of iterable) {
            if (--this.count < 0) yield a;
        }
    }

    * sync(iterable: Iterable<A>): Iterable<A> {
        for (const a of iterable) {
            if (--this.count < 0) yield a;
        }
    }
}

export function drop<A>(count: number): DropTransducer<A> {
    return new DropTransducer(count);
}

