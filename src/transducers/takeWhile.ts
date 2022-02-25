import {Transducer} from "./transducer";
import {Predicate} from "../predicates";

export class TakeWhileTransducer<A> implements Transducer<A, A> {
    constructor(public predicate: Predicate<A>) {
    }

    async* async_(iterable: AsyncIterable<A>): AsyncIterable<A> {
        for await (const a of iterable) {
            if (this.predicate(a)) yield a;
            else return;
        }
    }

    * sync(iterable: Iterable<A>): Iterable<A> {
        for (const a of iterable) {
            if (this.predicate(a)) yield a;
            else return;
        }
    }
}

export function takeWhile<T>(predicate: (t: T) => boolean): TakeWhileTransducer<T> {
    return new TakeWhileTransducer(predicate)
}