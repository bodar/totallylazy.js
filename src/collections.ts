import {Transducer} from "./transducers";
import {sequence} from "./sequence";

export type Mapper<A, B> = (a: A) => B;
export type Comparator<A> = (a: A, b: A) => number;

export function ascending<T>(a: T, b: T) {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

export function descending<T>(a: T, b: T): number {
    if (a < b) return 1;
    if (a > b) return -1;
    return 0;
}

export interface Key<A, K extends keyof A> extends Mapper<A, A[K]> {
    name: K
}

export function key<A, K extends keyof A>(name: K): Key<A, K> {
    return Object.assign((a: A) => a[name], {name})
}

export interface Reducer<A, B> {
    call(accumulator: B, instance: A): B;

    identity(): B;
}

export function isIterable(instance: any): instance is Iterable<any> {
    return typeof instance == 'object' && Symbol.iterator in instance;
}

export function isAsyncIterable(instance: any): instance is AsyncIterable<any> {
    return typeof instance == 'object' && Symbol.asyncIterator in instance;
}

export function isPromiseLike(instance: any): instance is PromiseLike<any> {
    return typeof instance == 'object' && 'then' in instance;
}

export function toIterable<T>(...t: T[]): Iterable<T> {
    return t;
}

export function array<A>(iterable: Iterable<A>): Array<A>
export function array<A, B>(a: Iterable<A>, b: Transducer<A, B>): Array<B>;
export function array<A, B, C>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>): Array<C>;
export function array<A, B, C, D>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>): Array<D>;
export function array<A, B, C, D, E>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>): Array<E>;
export function array<A, B, C, D, E, F>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>, f: Transducer<E, F>): Array<F>;

export function array<A>(iterable: AsyncIterable<A>): Promise<Array<A>>
export function array<A, B>(a: AsyncIterable<A>, b: Transducer<A, B>): Promise<Array<B>>;
export function array<A, B, C>(a: AsyncIterable<A>, b: Transducer<A, B>, c: Transducer<B, C>): Promise<Array<C>>;
export function array<A, B, C, D>(a: AsyncIterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>): Promise<Array<D>>;
export function array<A, B, C, D, E>(a: AsyncIterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>): Promise<Array<E>>;
export function array<A, B, C, D, E, F>(a: AsyncIterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>, f: Transducer<E, F>): Promise<Array<F>>;
export function array(source: Iterable<any> | AsyncIterable<any>, ...transducers: Transducer<any, any>[]): Array<any> | Promise<Array<any>> {
    if (isIterable(source)) {
        // @ts-ignore
        return toArray(sequence(source, ...transducers));
    }
    // @ts-ignore
    return toPromiseArray(sequence(source, ...transducers));
}

function toArray<T>(iterable: Iterable<T>): T[] {
    const result = [];
    for (const value of iterable) result.push(value);
    return result;
}

async function toPromiseArray<T>(iterable: AsyncIterable<T>): Promise<T[]> {
    const result: T[] = [];
    for await (const value of iterable) result.push(value);
    return result;
}

export async function* toAsyncIterable<A>(promise: PromiseLike<A>): AsyncIterable<A> {
    yield promise;
}


export function by<A, K extends keyof A>(key: K, comparator: Comparator<A[K]> = ascending): Comparator<A> {
    return (a: A, b: A) => {
        return comparator(a[key], b[key]);
    }
}


