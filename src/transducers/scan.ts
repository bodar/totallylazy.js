import {Reducer} from "../collections";
import {Transducer} from "./transducer";

export class ScanTransducer<A, B> implements Transducer<A, B> {
    constructor(public reducer: Reducer<A, B>, public seed: B) {
    }

    async* async_(iterable: AsyncIterable<A>): AsyncIterable<B> {
        let accumulator = this.seed;
        yield accumulator;
        for await (const a of iterable) {
            yield accumulator = this.reducer(accumulator, a);
        }
    }

    * sync(iterable: Iterable<A>): Iterable<B> {
        let accumulator = this.seed;
        yield accumulator;
        for (const a of iterable) {
            yield accumulator = this.reducer(accumulator, a);
        }
    }
}

export function scan<A, B>(reducer: Reducer<A, B>, seed: B): ScanTransducer<A, B> {
    return new ScanTransducer(reducer, seed);
}

