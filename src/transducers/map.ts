import {Mapper} from "../collections";
import {Transducer} from "./transducer";

export class MapTransducer<A, B> implements Transducer<A, B> {
    constructor(public mapper: Mapper<A, B>) {
    }

    async* async_(iterable: AsyncIterable<A>): AsyncIterable<B> {
        for await (const a of iterable) {
            yield this.mapper(a);
        }
    }

    * sync(iterable: Iterable<A>): Iterable<B> {
        for (const a of iterable) {
            yield this.mapper(a);
        }
    }
}

export function map<A, B>(mapper: Mapper<A, B>): MapTransducer<A, B> {
    return new MapTransducer(mapper);
}