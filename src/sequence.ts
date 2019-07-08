import {add, increment, subtract} from "./numbers";
import {takeWhile, Transducer} from "./transducers";

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
        if (end < start) yield* pipe(iterate(subtract(absolute), start), takeWhile(n => n >= end));
        else yield* pipe(iterate(add(absolute), start), takeWhile(n => n <= end));
    }
}

export function pipe<A, B>(a: Iterable<A>, b: Transducer<A, B>): Iterable<B>;
export function pipe<A, B, C>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>): Iterable<C>;
export function pipe<A, B, C, D>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>): Iterable<D>;
export function pipe<A, B, C, D, E>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e:  Transducer<D, E>): Iterable<E>;
export function pipe(a: Iterable<any>, ...args: Transducer<any, any>[]): Iterable<any> {
    return args.reduce((r, v) => v.sync(r), a);
}


