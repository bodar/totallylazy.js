import {Chunk} from "./api";

if (typeof Symbol.asyncIterator == 'undefined') {
    (Symbol as any).asyncIterator = Symbol.for("Symbol.asyncIterator");
}

export abstract class Transducer<A, B> {
    abstract call(iterable: AsyncIterable<A>): AsyncIterable<B>;

    compose<C>(b: Transducer<B, C>): Transducer<A, C> {
        return compose(this, b);
    }

    map<C>(mapper: Mapper<B, C>): Transducer<A, C> {
        return compose(this, map(mapper));
    }

    scan<C>(reducer: Reducer<C, B>): Transducer<A, C> {
        return compose(this, scan(reducer));
    }
}

export class IdentityTransducer<A> extends Transducer<A, A> {
    call(iterator: AsyncIterable<A>): AsyncIterable<A> {
        return iterator;
    }
}

export function identity<A>(): IdentityTransducer<A> {
    return new IdentityTransducer()
}

export type Mapper<A, B> = (a: A) => B;

export class MapTransducer<A, B> extends Transducer<A, B> {
    constructor(public mapper: Mapper<A, B>) {
        super();
    }

    call(iterable: AsyncIterable<A>): AsyncIterable<B> {
        const self = this;
        const iterator = iterable[Symbol.asyncIterator]();
        return asyncIterable({
            next(): Promise<IteratorResult<B>> {
                return iterator.next().then(result => {
                    if (result.done) return result as any;
                    return {value: self.mapper(result.value), done: false};
                });
            }
        });
    }
}

export function asyncIterable<A>(iterator: AsyncIterator<A>): AsyncIterable<A> {
    return {
        [Symbol.asyncIterator](): AsyncIterator<A> {
            return iterator;
        }
    };
}

export function map<A, B>(mapper: Mapper<A, B>): MapTransducer<A, B> {
    return new MapTransducer<A, B>(mapper);
}

export class CompositeTransducer<A, B, C> extends Transducer<A, C> {
    constructor(public a: Transducer<A, B>, public b: Transducer<B, C>) {
        super();
    }

    call(iterator: AsyncIterable<A>): AsyncIterable<C> {
        return this.b.call(this.a.call(iterator));
    }
}

export function compose<A, B, C>(a: Transducer<A, B>, b: Transducer<B, C>): CompositeTransducer<A, B, C> {
    return new CompositeTransducer(a, b);
}

export interface Reducer<A, T> {
    call(a: A, t: T): A;

    identity(): A;
}

export class ScanTransducer<T, A> extends Transducer<T, A> {
    constructor(public reducer: Reducer<A, T>, public accumilator: A = reducer.identity()) {
        super();
    }

    call(iterable: AsyncIterable<T>): AsyncIterable<A> {
        const self = this;
        const iterator = iterable[Symbol.asyncIterator]();
        return asyncIterable({
            next(): Promise<IteratorResult<A>> {
                return iterator.next().then(result => {
                    if (result.done) return result as any;
                    self.accumilator = self.reducer.call(self.accumilator, result.value);
                    return {value: self.accumilator, done: false};
                })
            }
        });
    }
}

export function scan<T, A>(reducer: Reducer<A, T>): ScanTransducer<T, A> {
    return new ScanTransducer(reducer);
}

export class Sum implements Reducer<number, number> {
    call(a: number, b: number): number {
        return a + b;
    }

    identity(): number {
        return 0;
    }
}

export const sum = new Sum();