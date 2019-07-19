import {add, increment, subtract} from "./numbers";
import {decompose, takeWhile, Transducer} from "./transducers";
import {flatten} from "./arrays";

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
    if (end === undefined) yield* iterate(increment, start);
    else {
        const absolute = Math.abs(step);
        if (end < start) yield* sequence(iterate(subtract(absolute), start), takeWhile(n => n >= end));
        else yield* sequence(iterate(add(absolute), start), takeWhile(n => n <= end));
    }
}

export function sequence<A, B>(a: Iterable<A>, b: Transducer<A, B>): Sequence<B>;
export function sequence<A, B, C>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>): Sequence<C>;
export function sequence<A, B, C, D>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>): Sequence<D>;
export function sequence<A, B, C, D, E>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e:  Transducer<D, E>): Sequence<E>;
export function sequence(source: Iterable<any>, ...transducers: Transducer<any, any>[]): Sequence<any> {
    return new Sequence<any>(source, transducers);
}

export class Sequence<T> implements Iterable<T>{
    constructor(public source: Iterable<any>, public transducers: Transducer<any, any>[]){

    }

    [Symbol.iterator](): Iterator<T> {
        return this.transducers.reduce((r, v) => v.sync(r), this.source)[Symbol.iterator]();
    }
}


