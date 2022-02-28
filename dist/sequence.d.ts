import { Transducer } from "./transducers";
import { IterableLike } from "./collections";
export declare function iterate<T>(generator: (t: T) => T, value: T): Iterable<T>;
export declare function repeat<T>(generator: () => T): Iterable<T>;
export declare function range(start: number, end?: number, step?: number): Iterable<number>;
export declare function sequence<A>(a: IterableLike<A>): Sequence<A>;
export declare function sequence<A, B>(a: IterableLike<A>, b: Transducer<A, B>): Sequence<B>;
export declare function sequence<A, B, C>(a: IterableLike<A>, b: Transducer<A, B>, c: Transducer<B, C>): Sequence<C>;
export declare function sequence<A, B, C, D>(a: IterableLike<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>): Sequence<D>;
export declare function sequence<A, B, C, D, E>(a: IterableLike<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>): Sequence<E>;
export declare function sequence<A, B, C, D, E, F>(a: IterableLike<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>, f: Transducer<E, F>): Sequence<F>;
export declare function sequence<A>(a: AsyncIterable<A>): AsyncSequence<A>;
export declare function sequence<A, B>(a: AsyncIterable<A>, b: Transducer<A, B>): AsyncSequence<B>;
export declare function sequence<A, B, C>(a: AsyncIterable<A>, b: Transducer<A, B>, c: Transducer<B, C>): AsyncSequence<C>;
export declare function sequence<A, B, C, D>(a: AsyncIterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>): AsyncSequence<D>;
export declare function sequence<A, B, C, D, E>(a: AsyncIterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>): AsyncSequence<E>;
export declare function sequence<A, B, C, D, E, F>(a: AsyncIterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>, f: Transducer<E, F>): AsyncSequence<F>;
export declare class Sequence<T> implements Iterable<T> {
    source: Iterable<any>;
    transducers: Transducer<any, any>[];
    constructor(source: Iterable<any>, transducers: Transducer<any, any>[]);
    [Symbol.iterator](): Iterator<T>;
}
export declare class AsyncSequence<T> implements AsyncIterable<T> {
    source: AsyncIterable<any>;
    transducers: Transducer<any, any>[];
    constructor(source: AsyncIterable<any>, transducers: Transducer<any, any>[]);
    [Symbol.asyncIterator](): AsyncIterator<T>;
}
