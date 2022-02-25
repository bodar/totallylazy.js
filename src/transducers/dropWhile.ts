import {Transducer} from "./transducer";
import {Predicate} from "../predicates";

export class DropWhileTransducer<A> implements Transducer<A, A> {
    constructor(public predicate: Predicate<A>) {
    }

    async* async_(iterable: AsyncIterable<A>): AsyncIterable<A> {
        let shouldDrop = true;
        for await (const a of iterable) {
            if (shouldDrop) shouldDrop = this.predicate(a);
            if (!shouldDrop) yield a;
        }
    }

    * sync(iterable: Iterable<A>): Iterable<A> {
        let shouldDrop = true;
        for (const a of iterable) {
            if (shouldDrop) shouldDrop = this.predicate(a);
            if (!shouldDrop) yield a;
        }
    }
}

export function dropWhile<A>(predicate: Predicate<A>): DropWhileTransducer<A> {
    return new DropWhileTransducer(predicate);
}