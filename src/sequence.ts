import {add, increment, subtract} from "./numbers";
import {takeWhile, Transducer} from "./transducers";
import {isAsyncIterable, isIterable} from "./collections";

export function* iterate<T>(generator: (t: T) => T, value: T): Iterable<T> {
    while (true) {
        yield value;
        value = generator(value);
    }
}

export function* repeat<T>(generator: () => T): Iterable<T> {
    while (true) {
        yield generator();
    }
}

export function* range(start: number, end?: number, step: number = 1): Iterable<number> {
    if (step === 0) throw new Error("step can not be 0");
    if (end === undefined) {
        yield* iterate(add(step), start);
    } else {
        const absolute = Math.abs(step);
        if (end < start) yield* sequence(iterate(subtract(absolute), start), takeWhile(n => n >= end));
        else yield* sequence(iterate(add(absolute), start), takeWhile(n => n <= end));
    }
}

export function sequence<A>(a: Iterable<A>): Sequence<A>;
export function sequence<A, B>(a: Iterable<A>, b: Transducer<A, B>): Sequence<B>;
export function sequence<A, B, C>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>): Sequence<C>;
export function sequence<A, B, C, D>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>): Sequence<D>;
export function sequence<A, B, C, D, E>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>): Sequence<E>;
export function sequence<A, B, C, D, E, F>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>, f: Transducer<E, F>): Sequence<F>;

export function sequence<A>(a: AsyncIterable<A>): AsyncSequence<A>;
export function sequence<A, B>(a: AsyncIterable<A>, b: Transducer<A, B>): AsyncSequence<B>;
export function sequence<A, B, C>(a: AsyncIterable<A>, b: Transducer<A, B>, c: Transducer<B, C>): AsyncSequence<C>;
export function sequence<A, B, C, D>(a: AsyncIterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>): AsyncSequence<D>;
export function sequence<A, B, C, D, E>(a: AsyncIterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>): AsyncSequence<E>;
export function sequence<A, B, C, D, E, F>(a: AsyncIterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>, f: Transducer<E, F>): AsyncSequence<F>;

export function sequence(source: Iterable<any> | AsyncIterable<any>, ...transducers: Transducer<any, any>[]): Sequence<any> | AsyncIterable<any> {
    return isIterable(source) ? new Sequence<any>(source, transducers) : new AsyncSequence<any>(source, transducers);
}

export class Sequence<T> implements Iterable<T> {
    constructor(public source: Iterable<any>, public transducers: Transducer<any, any>[]) {

    }

    [Symbol.iterator](): Iterator<T> {
        return this.transducers.reduce((r, v) => v.sync(r), this.source)[Symbol.iterator]();
    }
}

export class AsyncSequence<T> implements AsyncIterable<T> {
    constructor(public source: AsyncIterable<any>, public transducers: Transducer<any, any>[]) {

    }

    [Symbol.asyncIterator](): AsyncIterator<T> {
        return this.transducers.reduce((r, v) => v.async_(r), this.source)[Symbol.asyncIterator]();
    }
}


