import {Transducer} from "./transducer";

export class FirstTransducer<A> implements Transducer<A, A> {
    async* async_(iterable: AsyncIterable<A>): AsyncIterable<A> {
        for await (const a of iterable) {
            return yield a;
        }
    }

    * sync(iterable: Iterable<A>): Iterable<A> {
        for (const a of iterable) {
            return yield a;
        }
    }
}

export function first<A>(): FirstTransducer<A> {
    return new FirstTransducer();
}