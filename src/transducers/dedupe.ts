import {Transducer} from "./transducer";
import {ascending, Comparator} from "../collections";

export class DedupeTransducer<A> implements Transducer<A, A> {
    constructor(public comparator: Comparator<A>) {
    }

    async* async_(iterable: AsyncIterable<A>): AsyncIterable<A> {
        let previous;
        for await (const current of iterable) {
            if (typeof previous === 'undefined') yield current;
            else if (this.comparator(current, previous) !== 0) yield current;
            previous = current;
        }
    }

    * sync(iterable: Iterable<A>): Iterable<A> {
        let previous;
        for (const current of iterable) {
            if (typeof previous === 'undefined') yield current;
            else if (this.comparator(current, previous) !== 0) yield current;
            previous = current;
        }
    }
}

export function dedupe<A>(comparator: Comparator<A> = ascending): DedupeTransducer<A> {
    return new DedupeTransducer(comparator)
}