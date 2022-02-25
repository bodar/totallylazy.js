import {Transducer} from "./transducer";

export function windowed<A>(size: number, step: number = 1, remainder = false): WindowedTransducer<A> {
    return new WindowedTransducer(size, step, remainder);
}

export class WindowedTransducer<A> implements Transducer<A, A[]> {
    constructor(public size: number, public step: number, private remainder: boolean) {
    }

    async* async_(iterable: AsyncIterable<A>): AsyncIterable<A[]> {
        let buffer: A[] = [];
        let skip = 0;
        for await (const current of iterable) {
            if (skip > 0) {
                skip--;
                continue;
            }
            buffer.push(current);
            if (buffer.length === this.size) {
                yield [...buffer];
                buffer = buffer.slice(this.step);
                if (this.step > this.size) skip = this.step - this.size;
            }
        }
        if (this.remainder) yield [...buffer];
    }

    * sync(iterable: Iterable<A>): Iterable<A[]> {
        let buffer: A[] = [];
        let skip = 0;
        for (const current of iterable) {
            if (skip > 0) {
                skip--;
                continue;
            }
            buffer.push(current);
            if (buffer.length === this.size) {
                yield [...buffer];
                buffer = buffer.slice(this.step);
                if (this.step > this.size) skip = this.step - this.size;
            }
        }
        if (this.remainder) yield [...buffer];
    }
}