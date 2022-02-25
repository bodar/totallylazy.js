import {isArrayLike, isIterable, IterableLike} from "./collections";
import {Transducer} from "./transducers/transducer";

export function array<A>(iterable: IterableLike<A>): Array<A>
export function array<A, B>(a: IterableLike<A>, b: Transducer<A, B>): Array<B>;
export function array<A, B, C>(a: IterableLike<A>, b: Transducer<A, B>, c: Transducer<B, C>): Array<C>;
export function array<A, B, C, D>(a: IterableLike<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>): Array<D>;
export function array<A, B, C, D, E>(a: IterableLike<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>): Array<E>;
export function array<A, B, C, D, E, F>(a: IterableLike<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>, f: Transducer<E, F>): Array<F>;
export function array<A>(iterable: AsyncIterable<A>): Promise<Array<A>>
export function array<A, B>(a: AsyncIterable<A>, b: Transducer<A, B>): Promise<Array<B>>;
export function array<A, B, C>(a: AsyncIterable<A>, b: Transducer<A, B>, c: Transducer<B, C>): Promise<Array<C>>;
export function array<A, B, C, D>(a: AsyncIterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>): Promise<Array<D>>;
export function array<A, B, C, D, E>(a: AsyncIterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>): Promise<Array<E>>;
export function array<A, B, C, D, E, F>(a: AsyncIterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>, f: Transducer<E, F>): Promise<Array<F>>;
export function array(source: IterableLike<any> | AsyncIterable<any>, ...transducers: Transducer<any, any>[]): Array<any> | Promise<Array<any>> {
    if (isIterable(source) || isArrayLike(source)) {
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

