import {Transducer} from "./transducer";

export class TakeTransducer<A> implements Transducer<A, A> {
    constructor(public count: number) {
        if (typeof count === "undefined") throw new Error('Count can not be undefined');
    }

    async* async_(iterable: AsyncIterable<A>): AsyncIterable<A> {
        if (this.count < 1) return;
        for await (const a of iterable) {
            yield a;
            if ((--this.count) < 1) return;
        }
    }

    * sync(iterable: Iterable<A>): Iterable<A> {
        if (this.count < 1) return;
        for (const a of iterable) {
            yield a;
            if ((--this.count) < 1) return;
        }
    }
}

export function take<A>(count: number): TakeTransducer<A> {
    return new TakeTransducer(count);
}

