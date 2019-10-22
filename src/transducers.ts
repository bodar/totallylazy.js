import {array, ascending, Comparator, isAsyncIterable, isIterable, Mapper, Reducer} from "./collections";
import {Predicate} from "./predicates";
import {AVLTree} from "./avltree";
import {range} from "./sequence";

export interface Transducer<A, B> {
    sync(iterable: Iterable<A>): Iterable<B>;

    async_(iterable: AsyncIterable<A>): AsyncIterable<B>;
}

export class IdentityTransducer<A> implements Transducer<A, A> {
    async_(iterable: AsyncIterable<A>): AsyncIterable<A> {
        return iterable;
    }

    sync(iterable: Iterable<A>): Iterable<A> {
        return iterable;
    }
}

export function identity<A>(): IdentityTransducer<A> {
    return new IdentityTransducer()
}

// alias
export const transducer = identity;


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

export class ZipTransducer<A, B> implements Transducer<A, [A, B]> {
    constructor(public other: Iterable<B> | AsyncIterable<B>) {
    }

    async* async_(iterable: AsyncIterable<A>): AsyncIterable<[A, B]> {
        if (!isAsyncIterable(this.other)) throw new Error("Unsupported operation exception");
        const iteratorA = iterable[Symbol.asyncIterator]();
        const iteratorB = this.other[Symbol.asyncIterator]();
        while (true) {
            const [resultA, resultB] = await Promise.all([iteratorA.next(), iteratorB.next()]);
            if (resultA.done || resultB.done) return;
            yield [resultA.value, resultB.value];
        }
    }

    * sync(iterable: Iterable<A>): Iterable<[A, B]> {
        if (!isIterable(this.other)) throw new Error("Unsupported operation exception");
        const iteratorA = iterable[Symbol.iterator]();
        const iteratorB = this.other[Symbol.iterator]();
        while (true) {
            const resultA = iteratorA.next(), resultB = iteratorB.next();
            if (resultA.done || resultB.done) return;
            yield [resultA.value, resultB.value];
        }
    }
}

export function zip<A, B>(other: Iterable<B> | AsyncIterable<B>): ZipTransducer<A, B> {
    return new ZipTransducer(other);
}

export function zipWithIndex<A>(): ZipTransducer<A, number> {
    return new ZipTransducer(range(0));
}

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

export function reject<A>(predicate: Predicate<A>): FilterTransducer<A> {
    return new FilterTransducer(a => !predicate(a));
}

export function find<A>(predicate: Predicate<A>): Transducer<A, A> {
    return compose(filter(predicate), first());
}

export class CompositeTransducer<A, B, C> implements Transducer<A, C> {
    constructor(public a: Transducer<A, B>, public b: Transducer<B, C>) {
    }

    async_(iterator: AsyncIterable<A>): AsyncIterable<C> {
        return this.b.async_(this.a.async_(iterator));
    }

    sync(iterator: Iterable<A>): Iterable<C> {
        return this.b.sync(this.a.sync(iterator));
    }
}

export function compose<A, B, C>(a: Transducer<A, B>, b: Transducer<B, C>): CompositeTransducer<A, B, C> {
    return new CompositeTransducer(a, b);
}

export function* decompose(transducer: Transducer<any, any>): Iterable<Transducer<any, any>> {
    if (transducer instanceof CompositeTransducer) {
        yield* decompose(transducer.a);
        yield* decompose(transducer.b);
    } else {
        yield transducer;
    }
}

export class ScanTransducer<A, B> implements Transducer<A, B> {
    constructor(public reducer: Reducer<A, B>, public seed:B) {
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

export function scan<A, B>(reducer: Reducer<A, B>, seed:B): ScanTransducer<A, B> {
    return new ScanTransducer(reducer, seed);
}

export function reduce<A, B>(reducer: Reducer<A, B>, seed:B): Transducer<A, B> {
    return compose(scan(reducer, seed), last());
}

export class TakeTransducer<A> implements Transducer<A, A> {
    constructor(public count: number) {
    }

    async* async_(iterable: AsyncIterable<A>): AsyncIterable<A> {
        if (this.count < 1) return;
        for await (const a of iterable) {
            yield a;
            if ((--this.count) < 1) return;
        }
    }

    * sync(iterable: Iterable<A>): Iterable<A> {
        if (this.count < 1) return;
        for (const a of iterable) {
            yield a;
            if ((--this.count) < 1) return;
        }
    }
}

export function take<A, B>(count: number): TakeTransducer<A> {
    return new TakeTransducer(count);
}

export class DropTransducer<A> implements Transducer<A, A> {
    constructor(public count: number) {
    }

    async* async_(iterable: AsyncIterable<A>): AsyncIterable<A> {
        for await (const a of iterable) {
            if (--this.count < 0) yield a;
        }
    }

    * sync(iterable: Iterable<A>): Iterable<A> {
        for (const a of iterable) {
            if (--this.count < 0) yield a;
        }
    }
}

export function drop<A>(count: number): DropTransducer<A> {
    return new DropTransducer(count);
}

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

export class TakeWhileTransducer<A> implements Transducer<A, A> {
    constructor(public predicate: Predicate<A>) {
    }

    async* async_(iterable: AsyncIterable<A>): AsyncIterable<A> {
        for await (const a of iterable) {
            if (this.predicate(a)) yield a;
            else return;
        }
    }

    * sync(iterable: Iterable<A>): Iterable<A> {
        for (const a of iterable) {
            if (this.predicate(a)) yield a;
            else return;
        }
    }
}

export function takeWhile<T>(predicate: (t: T) => boolean): TakeWhileTransducer<T> {
    return new TakeWhileTransducer(predicate)
}


export class SortTransducer<A> implements Transducer<A, A> {
    constructor(public comparator: Comparator<A>) {
    }

    async* async_(iterable: AsyncIterable<A>): AsyncIterable<A> {
        const result = await array(iterable);
        result.sort(this.comparator);
        yield* result;
    }

    * sync(iterable: Iterable<A>): Iterable<A> {
        const result = array(iterable);
        result.sort(this.comparator);
        yield* result;
    }
}

export function sort<A>(comparator: Comparator<A> = ascending): SortTransducer<A> {
    return new SortTransducer(comparator);
}

export class DedupTransducer<A> implements Transducer<A, A> {
    constructor(public comparator: Comparator<A>) {
    }

    async* async_(iterable: AsyncIterable<A>): AsyncIterable<A> {
        let previous;
        for await (const current of iterable) {
            if (typeof previous === 'undefined') yield current;
            else if (this.comparator(current, previous) !== 0) yield current;
            previous = current;
        }
    }

    * sync(iterable: Iterable<A>): Iterable<A> {
        let previous;
        for (const current of iterable) {
            if (typeof previous === 'undefined') yield current;
            else if (this.comparator(current, previous) !== 0) yield current;
            previous = current;
        }
    }
}

export function dedupe<A>(comparator: Comparator<A> = ascending): DedupTransducer<A> {
    return new DedupTransducer(comparator)
}

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

export function unique<A>(comparator: Comparator<A> = ascending): DedupTransducer<A> {
    return new UniqueTransducer(comparator)
}

export function windowed<A>(size: number, step: number = 1, remainder = false): WindowedTransducer<A> {
    return new WindowedTransducer(size, step, remainder);
}

export class WindowedTransducer<A> implements Transducer<A, A[]> {
    constructor(public size: number, public step: number, private remainder:boolean) {
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
        if(this.remainder) yield [...buffer];
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
        if(this.remainder) yield [...buffer];
    }
}




