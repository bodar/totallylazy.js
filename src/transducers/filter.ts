import {Predicate} from "../predicates";
import {Transducer} from "./transducer";

export class FilterTransducer<A> implements Transducer<A, A> {
    constructor(public predicate: Predicate<A>) {
    }

    async* async_(iterable: AsyncIterable<A>): AsyncIterable<A> {
        for await (const a of iterable) {
            if (this.predicate(a)) yield a;
        }
    }

    * sync(iterable: Iterable<A>): Iterable<A> {
        for (const a of iterable) {
            if (this.predicate(a)) yield a;
        }
    }
}

export function filter<A>(predicate: Predicate<A>): FilterTransducer<A> {
    return new FilterTransducer(predicate);
}

// sensible alias
export const accept = filter;

