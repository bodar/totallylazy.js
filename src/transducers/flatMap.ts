import {Mapper} from "../collections";
import {Transducer} from "./transducer";

export class FlatMapTransducer<A, B> implements Transducer<A, B> {
    constructor(public mapper: Mapper<A, Iterable<B> | AsyncIterable<B>>) {
    }

    async* async_(iterable: AsyncIterable<A>): AsyncIterable<B> {
        for await (const a of iterable) {
            yield* this.mapper(a) as any as AsyncIterable<B>;
        }
    }

    * sync(iterable: Iterable<A>): Iterable<B> {
        for (const a of iterable) {
            yield* this.mapper(a) as any as Iterable<B>;
        }
    }
}

export function flatMap<A, B>(mapper: Mapper<A, Iterable<B> | AsyncIterable<B>>): FlatMapTransducer<A, B> {
    return new FlatMapTransducer(mapper);
}