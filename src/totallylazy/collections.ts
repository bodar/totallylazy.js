if (typeof Symbol.asyncIterator == 'undefined') {
    (Symbol as any).asyncIterator = Symbol.for("Symbol.asyncIterator");
}

export type Mapper<A, B> = (a: A) => B;
export type Predicate<A> = (a: A) => boolean;

export interface Reducer<A, B> {
    call(accumilator: B, instance: A): B;

    identity(): B;
}

export interface Contract<A> {
    map<B>(mapper: Mapper<A, B>): Contract<B>;

    flatMap<B>(mapper: Mapper<A, Contract<B>>): Contract<B>;

    filter(predicate: Predicate<A>): Contract<A>;

    find(predicate: Predicate<A>): Contract<A>;

    first(): Contract<A>;

    last(): Contract<A>;

    take(count: number): Contract<A>;

    takeWhile(predicate: Predicate<A>): Contract<A>;

    scan<B>(reducer: Reducer<A, B>): Contract<B>;

    reduce<B>(reducer: Reducer<A, B>): Contract<B>;
}

export interface Collection<A> extends Contract<A>, Iterable<A> {
    map<B>(mapper: Mapper<A, B>): Collection<B>;

    flatMap<B>(mapper: Mapper<A, Collection<B>>): Collection<B>;

    filter(predicate: Predicate<A>): Collection<A>;

    find(predicate: Predicate<A>): Collection<A>;

    first(): Collection<A>;

    last(): Collection<A>;

    take(count: number): Collection<A>;

    takeWhile(predicate: Predicate<A>): Collection<A>;

    scan<B>(reducer: Reducer<A, B>): Collection<B>;

    reduce<B>(reducer: Reducer<A, B>): Collection<B>;
}

export interface AsyncCollection<A> extends Contract<A>, AsyncIterable<A> {
    map<B>(mapper: Mapper<A, B>): AsyncCollection<B>;

    flatMap<B>(mapper: Mapper<A, AsyncCollection<B>>): AsyncCollection<B>;

    filter(predicate: Predicate<A>): AsyncCollection<A>;

    find(predicate: Predicate<A>): AsyncCollection<A>;

    first(): AsyncCollection<A>;

    last(): AsyncCollection<A>;

    take(count: number): AsyncCollection<A>;

    takeWhile(predicate: Predicate<A>): AsyncCollection<A>;

    scan<B>(reducer: Reducer<A, B>): AsyncCollection<B>;

    reduce<B>(reducer: Reducer<A, B>): AsyncCollection<B>;
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

export function toArray<T>(iterable: Iterable<T>): T[] {
    return [...iterable];
}

export async function toPromiseArray<T>(iterable: AsyncIterable<T>): Promise<T[]> {
    const result: T[] = [];
    for await (const value of iterable) result.push(value);
    return result;
}

export async function * toAsyncIterable<A>(promise:PromiseLike<A>): AsyncIterable<A>{
    yield promise;
}