import {Transducer} from "./transducer";

export class LastTransducer<A> implements Transducer<A, A> {
    async* async_(iterable: AsyncIterable<A>): AsyncIterable<A> {
        let last;
        for await (last of iterable) ;
        if (last !== undefined) yield last;
    }

    * sync(iterable: Iterable<A>): Iterable<A> {
        let last;
        for (last of iterable) ;
        if (last !== undefined) yield last;
    }
}

export function last<A>(): LastTransducer<A> {
    return new LastTransducer();
}