import {AsyncCollection, Collection, isAsyncIterable, isIterable, Mapper, Predicate, Reducer} from "./collections";
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
        return sequence(this.iterable, transducer);
    }
}

export interface Sequence<A> extends Collection<A> {
    map<B>(mapper: Mapper<A, B>): Sequence<B>;

    flatMap<B>(mapper: Mapper<A, Sequence<B>>): Sequence<B>;

    filter(predicate: Predicate<A>): Sequence<A>;

    find(predicate: Predicate<A>): Sequence<A>;

    first(): Sequence<A>;

    last(): Sequence<A>;

    take(count: number): Sequence<A>;

    takeWhile(predicate: Predicate<A>): Sequence<A>;

    scan<B>(reducer: Reducer<A, B>): Sequence<B>;

    reduce<B>(reducer: Reducer<A, B>): Sequence<B>;
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
        return sequence(this.iterable, transducer);
    }
}

export interface AsyncSequence<A> extends AsyncCollection<A> {
    map<B>(mapper: Mapper<A, B>): AsyncSequence<B>;

    flatMap<B>(mapper: Mapper<A, AsyncSequence<B>>): AsyncSequence<B>;

    filter(predicate: Predicate<A>): AsyncSequence<A>;

    find(predicate: Predicate<A>): AsyncSequence<A>;

    first(): AsyncSequence<A>;

    last(): AsyncSequence<A>;

    take(count: number): AsyncSequence<A>;

    takeWhile(predicate: Predicate<A>): AsyncSequence<A>;

    scan<B>(reducer: Reducer<A, B>): AsyncSequence<B>;

    reduce<B>(reducer: Reducer<A, B>): AsyncSequence<B>;
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

export class Single<A> extends Transducable<A> implements PromiseLike<A>, Collection<A> {
    protected constructor(public readonly original: Promise<any>, public readonly transducer: Transducer<any, A> = identity()) {
        super(transducer);
    }

    static of<A>(promise: PromiseLike<A>): Single<A>
    static of<A>(executor: Executor<A>): Single<A>
    static of<A>(value: any) {
        if (typeof value == 'function') return new Single<A>(new Promise<any>(value));
        return new Single<A>(value);
    }

    then<B, E>(onfulfilled?: ((value: A) => (PromiseLike<B> | B)) | null | undefined, onrejected?: ((reason: any) => (PromiseLike<E> | E)) | null | undefined): PromiseLike<B | E> {
        return this.original.then(onfulfilled, onrejected);
    }

    [Symbol.asyncIterator](): AsyncIterator<A> {
        const self = this;
        return this.transducer.async_(async function* () {
            yield self;
        }())[Symbol.asyncIterator]()
    }

    create<B>(transducer: Transducer<A, B>): Single<B> {
        return new Single(this.original, transducer);
    }
}

export interface Single<A> extends Collection<A> {
    map<B>(mapper: Mapper<A, B>): Single<B>;

    flatMap<B>(mapper: Mapper<A, Single<B>>): Single<B>;

    filter(predicate: Predicate<A>): Single<A>;

    find(predicate: Predicate<A>): Single<A>;

    first(): Single<A>;

    last(): Single<A>;

    take(count: number): Single<A>;

    takeWhile(predicate: Predicate<A>): Single<A>;

    scan<B>(reducer: Reducer<A, B>): Single<B>;

    reduce<B>(reducer: Reducer<A, B>): Single<B>;
}

export class Option<A> extends Transducable<A> implements Collection<A> {
    protected constructor(public readonly value?: any, public readonly transducer: Transducer<any, A> = identity()) {
        super(transducer);
    }

    static some<A>(instance: A): Option<A> {
        return new Option<A>(instance);
    }

    static none<A>(): Option<A> {
        return new Option<A>();
    }

    [Symbol.iterator](): Iterator<A> {
        return this.transducer.sync(typeof this.value !== 'undefined' ? [this.value] : [])[Symbol.iterator]()
    }

    create<B>(transducer: Transducer<A, B>): Option<B> {
        return new Option(this.value, transducer);
    }
}

export interface Option<A> extends Collection<A> {
    map<B>(mapper: Mapper<A, B>): Option<B>;

    flatMap<B>(mapper: Mapper<A, Option<B>>): Option<B>;

    filter(predicate: Predicate<A>): Option<A>;

    find(predicate: Predicate<A>): Option<A>;

    first(): Option<A>;

    last(): Option<A>;

    take(count: number): Option<A>;

    takeWhile(predicate: Predicate<A>): Option<A>;

    scan<B>(reducer: Reducer<A, B>): Option<B>;

    reduce<B>(reducer: Reducer<A, B>): Option<B>;
}

