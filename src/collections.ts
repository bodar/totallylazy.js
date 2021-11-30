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

export function comparators<T>(...comparators: Comparator<T>[]): Comparator<T> {
    return (a, b) => {
        for (const comparator of comparators) {
            const result = comparator(a, b);
            if (result != 0) return result;
        }
        return 0;
    }
}

export interface Key<A, K extends keyof A> extends Mapper<A, A[K]> {
    name: K
}

export function key<A, K extends keyof A>(name: K): Key<A, K> {
    return Object.assign((a: A) => a[name], {name})
}

export function value<A, K extends keyof A>(name: K): Mapper<A, A[K]> {
    return a => a[name];
}

export type Reducer<A, B> = (accumulator: B, value: A) => B;

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

export function* iterable<T>(values: ArrayLike<T>): Iterable<T> {
    for (let i = 0; i < values.length; i++) {
        yield values[i];
    }
}

export async function* asyncIterable<T>(values: Array<Promise<T> | T> | Iterable<Promise<T> | T>): AsyncIterable<T> {
    for (const t of values) {
        yield t;
    }
}

export function isArrayLike(value:any): value is ArrayLike<any> {
    return typeof value === "object" && typeof value['length'] === "number";
}

export type IterableLike<T> = Iterable<T> | ArrayLike<T>

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

export async function* toAsyncIterable<A>(promise: PromiseLike<A>): AsyncIterable<A> {
    yield promise;
}

export function by<A, K extends keyof A>(key: K, comparator?: Comparator<A[K]>): Comparator<A>;
export function by<A, K>(mapper: Mapper<A, K>, comparator?: Comparator<K>): Comparator<A>;
export function by(mapperOfKey: any, comparator: Comparator<any> = ascending): Comparator<any> {
    if (typeof mapperOfKey === "function") return byFn(mapperOfKey, comparator);
    return byKey(mapperOfKey, comparator);
}

function byKey<A, K extends keyof A>(key: K, comparator: Comparator<A[K]> = ascending): Comparator<A> {
    return (a: A, b: A) => {
        return comparator(a[key], b[key]);
    }
}

function byFn<A, K>(mapper: Mapper<A, K>, comparator: Comparator<K> = ascending): Comparator<A> {
    return (a: A, b: A) => {
        return comparator(mapper(a), mapper(b));
    }
}


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


type StateHandler = [Function, Function];
type IteratorState<T> = IteratorResult<T> | Error;

export class AsyncIteratorHandler<T> implements AsyncIterableIterator<T> {
    private handlers: StateHandler[] = [];
    private state: IteratorState<T>[] = [];

    value(value: T) {
        this.newState({value, done: false});
    }

    error(value: Error) {
        this.newState(value);
    }

    close() {
        this.newState({value: undefined, done: true});
    }

    [Symbol.asyncIterator](): AsyncIterableIterator<T> {
        return this;
    }

    next(): Promise<IteratorResult<T>> {
        return new Promise<IteratorResult<T>>((resolve, reject) => {
            this.newHandler([resolve, reject]);
        });
    }

    private newState(newState: IteratorState<T>) {
        const handler = this.handlers.shift();
        if (typeof handler === 'undefined') return this.state.push(newState);
        const oldState = this.state.shift();
        if (typeof oldState === 'undefined') return this.consume(newState, handler);
        this.consume(oldState, handler);
        this.newState(newState);
    }

    private newHandler(newHandler: StateHandler) {
        const state = this.state.shift();
        if (typeof state === 'undefined') return this.handlers.push(newHandler)
        const oldHandler = this.handlers.shift();
        if (typeof oldHandler === 'undefined') return this.consume(state, newHandler);
        this.consume(state, oldHandler);
        this.newHandler(newHandler);
    }

    private consume<T>(state: IteratorState<T>, [resolve, reject]: [Function, Function]) {
        if (state instanceof Error) reject(state);
        else resolve(state);
    }
}

