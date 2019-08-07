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

export function array<T>(iterable: Iterable<T>): T[]
export function array<T>(iterable: AsyncIterable<T>): Promise<T[]>
export function array<T>(iterable: Iterable<T> | AsyncIterable<T>): T[] | Promise<T[]> {
    if (isIterable(iterable)) return toArray(iterable);
    return toPromiseArray(iterable);
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


