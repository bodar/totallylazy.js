import {
    AsyncCollection, Collection, isAsyncIterable, isIterable, isPromiseLike, Mapper, Predicate, Reducer,
    toAsyncIterable
} from "./collections";
import {identity, Transducable, Transducer} from "./transducers";
import {add, increment, subtract} from "./numbers";

export function iterate<T>(generator: (t: T) => T, value: T): Sequence<T> {
    return sequence(function* () {
        while (true) {
            yield value;
            value = generator(value);
        }
    })
}

export function repeat<T>(generator: () => T): Sequence<T> {
    return sequence(function* () {
        while (true) {
            yield generator();
        }
    });
}

export function range(start: number, end?: number, step: number = 1): Sequence<number> {
    return sequence(function* () {
        if (end === undefined) yield* iterate(increment, start);
        else {
            const absolute = Math.abs(step);
            if (end < start) yield* iterate(subtract(absolute), start).takeWhile(n => n >= end);
            else yield* iterate(add(absolute), start).takeWhile(n => n <= end);
        }
    });
}

export class Sequence<A> extends Transducable<A> implements Collection<A> {
    protected constructor(public readonly iterable: Iterable<any>, public readonly transducer: Transducer<any, A> = identity()) {
        super(transducer);
    }

    static of<A>(iterable: Iterable<A>): Sequence<A>;
    static of<B, A>(iterable: Iterable<B>, transducer: Transducer<B, A>): Sequence<A>;
    static of<B, A>(iterable: Iterable<B>, transducer?: Transducer<B, A>) {
        return new Sequence<A>(iterable, transducer);
    }

    [Symbol.iterator](): Iterator<A> {
        return this.transducer.sync(this.iterable)[Symbol.iterator]()
    }

    create<B>(transducer: Transducer<A, B>): Sequence<B> {
        return Sequence.of(this.iterable, transducer);
    }

    map<B>(mapper: Mapper<A, B>): Sequence<B> {
        return this.create(this.transducer.map(mapper));
    }

    flatMap<B>(mapper: Mapper<A, Sequence<B>>): Sequence<B> {
        return this.create(this.transducer.flatMap(mapper));
    }

    filter(predicate: Predicate<A>): Sequence<A> {
        return this.create(this.transducer.filter(predicate));
    }

    find(predicate: Predicate<A>): Option<A> {
        return Option.of(this.iterable, this.transducer.find(predicate));
    }

    first(): Option<A> {
        return Option.of(this.iterable, this.transducer.first());
    }

    last(): Option<A> {
        return Option.of(this.iterable, this.transducer.last());
    }

    take(count: number): Sequence<A> {
        return this.create(this.transducer.take(count));
    }

    takeWhile(predicate: Predicate<A>): Sequence<A> {
        return this.create(this.transducer.takeWhile(predicate));
    }

    scan<B>(reducer: Reducer<A, B>): Sequence<B> {
        return this.create(this.transducer.scan(reducer));
    }

    reduce<B>(reducer: Reducer<A, B>): Sequence<B> {
        return this.create(this.transducer.reduce(reducer));
    }
}

export class AsyncSequence<A> extends Transducable<A> implements AsyncCollection<A> {
    protected constructor(public readonly iterable: AsyncIterable<any>, public readonly transducer: Transducer<any, A> = identity()) {
        super(transducer);
    }

    static of<A>(iterable: AsyncIterable<A>): AsyncSequence<A>;
    static of<B, A>(iterable: AsyncIterable<B>, transducer: Transducer<B, A>): AsyncSequence<A>;
    static of<B, A>(iterable: AsyncIterable<B>, transducer?: Transducer<B, A>) {
        return new AsyncSequence<A>(iterable, transducer);
    }

    [Symbol.asyncIterator](): AsyncIterator<A> {
        return this.transducer.async_(this.iterable)[Symbol.asyncIterator]()
    }

    create<B>(transducer: Transducer<A, B>): AsyncSequence<B> {
        return AsyncSequence.of(this.iterable, transducer);
    }

    map<B>(mapper: Mapper<A, B>): AsyncSequence<B> {
        return this.create(this.transducer.map(mapper));
    }

    flatMap<B>(mapper: Mapper<A, AsyncSequence<B>>): AsyncSequence<B> {
        return this.create(this.transducer.flatMap(mapper));
    }

    filter(predicate: Predicate<A>): AsyncSequence<A> {
        return this.create(this.transducer.filter(predicate));
    }

    find(predicate: Predicate<A>): AsyncSequence<A> {
        return this.create(this.transducer.find(predicate));
    }

    first(): AsyncSequence<A> {
        return this.create(this.transducer.first());
    }

    last(): AsyncSequence<A> {
        return this.create(this.transducer.first());
    }

    take(count: number): AsyncSequence<A> {
        return this.create(this.transducer.take(count));
    }

    takeWhile(predicate: Predicate<A>): AsyncSequence<A> {
        return this.create(this.transducer.takeWhile(predicate));
    }

    scan<B>(reducer: Reducer<A, B>): AsyncSequence<B> {
        return this.create(this.transducer.scan(reducer));
    }

    reduce<B>(reducer: Reducer<A, B>): AsyncSequence<B> {
        return this.create(this.transducer.reduce(reducer));
    }
}

type IterableGenerator<A> = () => IterableIterator<A>;
type AsyncIterableGenerator<A> = () => AsyncIterableIterator<A>;
type Source<A> = Iterable<A> | AsyncIterable<A> | IterableGenerator<A> | AsyncIterableGenerator<A>;

export function sequence<A>(iterable: IterableGenerator<A>): Sequence<A>;
export function sequence<A>(iterable: AsyncIterableGenerator<A>): AsyncSequence<A>;
export function sequence<A>(iterable: Iterable<A>): Sequence<A>;
export function sequence<A>(iterable: AsyncIterable<A>): AsyncSequence<A>;
export function sequence<A, B>(iterable: Iterable<B>, transducer: Transducer<B, A>): Sequence<A>;
export function sequence<A, B>(iterable: AsyncIterable<B>, transducer: Transducer<B, A>): AsyncSequence<A>;
export function sequence(iterable: Source<any>, transducer?: Transducer<any, any>) {
    if (typeof iterable == 'function') iterable = iterable();
    if (typeof transducer == 'undefined') {
        if (isIterable(iterable)) return Sequence.of(iterable);
        if (isAsyncIterable(iterable)) return AsyncSequence.of(iterable);
    } else {
        if (isIterable(iterable)) return Sequence.of(iterable, transducer);
        if (isAsyncIterable(iterable)) return AsyncSequence.of(iterable, transducer);
    }
}

type Executor<A> = (resolve: (value?: A | PromiseLike<A>) => void, reject: (reason?: any) => void) => void;

export class Single<A> extends Transducable<A> implements PromiseLike<A>, AsyncCollection<A> {
    protected constructor(public readonly iterable: AsyncIterable<any>, public readonly transducer: Transducer<any, A> = identity()) {
        super(transducer);
    }

    static of<A>(promise: PromiseLike<A>): Single<A>
    static of<A>(executor: Executor<A>): Single<A>
    static of<B, A>(iterable: Iterable<B>, transducer: Transducer<B, A>): Single<A>;
    static of(value: any, transducer?: Transducer<any, any>) {
        if (typeof value == 'function') return new Single<any>(toAsyncIterable(new Promise<any>(value)));
        if (isPromiseLike(value)) return new Single<any>(toAsyncIterable(value));
        return new Single<any>(value, transducer);
    }

    then<B, E>(onfulfilled?: ((value: A) => (PromiseLike<B> | B)) | null | undefined, onrejected?: ((reason: any) => (PromiseLike<E> | E)) | null | undefined): PromiseLike<B | E> {
        return this.create(this.transducer.then(onfulfilled, onrejected));
    }

    [Symbol.asyncIterator](): AsyncIterator<A> {
        const self = this;
        return this.transducer.async_(toAsyncIterable(this))[Symbol.asyncIterator]()
    }

    create<B>(transducer: Transducer<A, B>): Single<B> {
        return new Single(this.iterable, transducer);
    }

    map<B>(mapper: Mapper<A, B>): Single<B> {
        return this.create(this.transducer.map(mapper));
    }

    flatMap<B>(mapper: Mapper<A, Single<B>>): Single<B> {
        return this.create(this.transducer.flatMap(mapper));
    }

    filter(predicate: Predicate<A>): Single<A> {
        return this.create(this.transducer.filter(predicate));
    }

    find(predicate: Predicate<A>): Single<A> {
        return this.create(this.transducer.find(predicate));
    }

    first(): Single<A> {
        return this.create(this.transducer.first());
    }

    last(): Single<A> {
        return this.create(this.transducer.first());
    }

    take(count: number): Single<A> {
        return this.create(this.transducer.take(count));
    }

    takeWhile(predicate: Predicate<A>): Single<A> {
        return this.create(this.transducer.takeWhile(predicate));
    }

    scan<B>(reducer: Reducer<A, B>): Single<B> {
        return this.create(this.transducer.scan(reducer));
    }

    reduce<B>(reducer: Reducer<A, B>): Single<B> {
        return this.create(this.transducer.reduce(reducer));
    }
}

export class Option<A> extends Transducable<A> implements Collection<A> {
    protected constructor(public readonly iterable: Iterable<any>, public readonly transducer: Transducer<any, A> = identity()) {
        super(transducer);
    }

    static some<A>(instance: A): Option<A> {
        return new Option<A>([instance]);
    }

    static none<A>(): Option<A> {
        return new Option<A>([]);
    }

    // package-protected!
    static of<B, A>(iterable: Iterable<B>, transducer: Transducer<B, A>): Option<A> {
        return new Option<A>(iterable, transducer);
    }

    [Symbol.iterator](): Iterator<A> {
        return this.transducer.sync(this.iterable)[Symbol.iterator]()
    }

    create<B>(transducer: Transducer<A, B>): Option<B> {
        return Option.of(this.iterable, transducer);
    }

    map<B>(mapper: Mapper<A, B>): Option<B> {
        return this.create(this.transducer.map(mapper));
    }

    flatMap<B>(mapper: Mapper<A, Option<B>>): Option<B> {
        return this.create(this.transducer.flatMap(mapper));
    }

    filter(predicate: Predicate<A>): Option<A> {
        return this.create(this.transducer.filter(predicate));
    }

    find(predicate: Predicate<A>): Option<A> {
        return this.create(this.transducer.find(predicate));
    }

    first(): Option<A> {
        return this.create(this.transducer.first());
    }

    last(): Option<A> {
        return this.create(this.transducer.first());
    }

    take(count: number): Option<A> {
        return this.create(this.transducer.take(count));
    }

    takeWhile(predicate: Predicate<A>): Option<A> {
        return this.create(this.transducer.takeWhile(predicate));
    }

    scan<B>(reducer: Reducer<A, B>): Option<B> {
        return this.create(this.transducer.scan(reducer));
    }

    reduce<B>(reducer: Reducer<A, B>): Option<B> {
        return this.create(this.transducer.reduce(reducer));
    }
}

