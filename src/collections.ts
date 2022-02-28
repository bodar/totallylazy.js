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

export function isArrayLike(value: any): value is ArrayLike<any> {
    return typeof value === "object" && typeof value['length'] === "number";
}

export type IterableLike<T> = Iterable<T> | ArrayLike<T>

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

