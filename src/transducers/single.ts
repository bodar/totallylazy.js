import {isIterable} from "../collections";
import {Transducer} from "./transducer";

export function single<A>(iterable: Iterable<A>): A
export function single<A, B>(a: Iterable<A>, b: Transducer<A, B>): B;
export function single<A, B, C>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>): C;
export function single<A, B, C, D>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>): D;
export function single<A, B, C, D, E>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>): E;
export function single<A, B, C, D, E, F>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>, f: Transducer<E, F>): F;
export function single<A>(iterable: AsyncIterable<A>): Promise<A>
export function single<A, B>(a: AsyncIterable<A>, b: Transducer<A, B>): Promise<B>;
export function single<A, B, C>(a: AsyncIterable<A>, b: Transducer<A, B>, c: Transducer<B, C>): Promise<C>;
export function single<A, B, C, D>(a: AsyncIterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>): Promise<D>;
export function single<A, B, C, D, E>(a: AsyncIterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>): Promise<E>;
export function single<A, B, C, D, E, F>(a: AsyncIterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>, f: Transducer<E, F>): Promise<F>;
export function single(source: Iterable<any> | AsyncIterable<any>, ...transducers: Transducer<any, any>[]): Array<any> | Promise<Array<any>> {
    if (isIterable(source)) {
        // @ts-ignore
        return toSingle(sequence(source, ...transducers));
    }
    // @ts-ignore
    return toSinglePromise(sequence(source, ...transducers));
}

function toSingle<A>(iterable: Iterable<A>): A {
    for (const a of iterable) return a;
    throw new Error("Expected a single value");
}

async function toSinglePromise<A>(iterable: AsyncIterable<A>): Promise<A> {
    for await (const value of iterable) return value;
    throw new Error("Expected a single value");
}