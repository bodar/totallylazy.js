import {ascending, Comparator} from "../collections";
import {AVLTree} from "../avltree";
import {Transducer} from "./transducer";
import {DedupeTransducer} from "./dedupe";

export class UniqueTransducer<A> implements Transducer<A, A> {
    constructor(public comparator: Comparator<A>) {
    }

    async* async_(iterable: AsyncIterable<A>): AsyncIterable<A> {
        let values = AVLTree.empty<A, undefined>(this.comparator);
        for await (const current of iterable) {
            if (!values.contains(current)) {
                values = values.insert(current, undefined);
                yield current;
            }
        }
    }

    * sync(iterable: Iterable<A>): Iterable<A> {
        let values = AVLTree.empty<A, undefined>(this.comparator);
        for (const current of iterable) {
            if (!values.contains(current)) {
                values = values.insert(current, undefined);
                yield current;
            }
        }
    }
}

export function unique<A>(comparator: Comparator<A> = ascending): DedupeTransducer<A> {
    return new UniqueTransducer(comparator)
}