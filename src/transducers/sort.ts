import {ascending, Comparator} from "../collections";
import {array} from "../array";
import {Transducer} from "./transducer";

export class SortTransducer<A> implements Transducer<A, A> {
    constructor(public comparator: Comparator<A>) {
    }

    async* async_(iterable: AsyncIterable<A>): AsyncIterable<A> {
        const result = await array(iterable);
        result.sort(this.comparator);
        yield* result;
    }

    * sync(iterable: Iterable<A>): Iterable<A> {
        const result = array(iterable);
        result.sort(this.comparator);
        yield* result;
    }
}

export function sort<A>(comparator: Comparator<A> = ascending): SortTransducer<A> {
    return new SortTransducer(comparator);
}