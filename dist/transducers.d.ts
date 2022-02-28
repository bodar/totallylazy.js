import { Comparator, Mapper, Reducer } from "./collections";
import { Predicate } from "./predicates";
export interface Transducer<A, B> {
    sync(iterable: Iterable<A>): Iterable<B>;
    async_(iterable: AsyncIterable<A>): AsyncIterable<B>;
}
export declare class IdentityTransducer<A> implements Transducer<A, A> {
    async_(iterable: AsyncIterable<A>): AsyncIterable<A>;
    sync(iterable: Iterable<A>): Iterable<A>;
}
export declare function identity<A>(): IdentityTransducer<A>;
export declare const transducer: typeof identity;
export declare class FirstTransducer<A> implements Transducer<A, A> {
    async_(iterable: AsyncIterable<A>): AsyncIterable<A>;
    sync(iterable: Iterable<A>): Iterable<A>;
}
export declare function first<A>(): FirstTransducer<A>;
export declare class LastTransducer<A> implements Transducer<A, A> {
    async_(iterable: AsyncIterable<A>): AsyncIterable<A>;
    sync(iterable: Iterable<A>): Iterable<A>;
}
export declare function last<A>(): LastTransducer<A>;
export declare class MapTransducer<A, B> implements Transducer<A, B> {
    mapper: Mapper<A, B>;
    constructor(mapper: Mapper<A, B>);
    async_(iterable: AsyncIterable<A>): AsyncIterable<B>;
    sync(iterable: Iterable<A>): Iterable<B>;
}
export declare function map<A, B>(mapper: Mapper<A, B>): MapTransducer<A, B>;
export declare class ZipTransducer<A, B> implements Transducer<A, [A, B]> {
    other: Iterable<B> | AsyncIterable<B>;
    constructor(other: Iterable<B> | AsyncIterable<B>);
    async_(iterable: AsyncIterable<A>): AsyncIterable<[A, B]>;
    sync(iterable: Iterable<A>): Iterable<[A, B]>;
}
export declare function zip<A, B>(other: Iterable<B> | AsyncIterable<B>): ZipTransducer<A, B>;
export declare function zipWithIndex<A>(): ZipTransducer<A, number>;
export declare class FlatMapTransducer<A, B> implements Transducer<A, B> {
    mapper: Mapper<A, Iterable<B> | AsyncIterable<B>>;
    constructor(mapper: Mapper<A, Iterable<B> | AsyncIterable<B>>);
    async_(iterable: AsyncIterable<A>): AsyncIterable<B>;
    sync(iterable: Iterable<A>): Iterable<B>;
}
export declare function flatMap<A, B>(mapper: Mapper<A, Iterable<B> | AsyncIterable<B>>): FlatMapTransducer<A, B>;
export declare class FilterTransducer<A> implements Transducer<A, A> {
    predicate: Predicate<A>;
    constructor(predicate: Predicate<A>);
    async_(iterable: AsyncIterable<A>): AsyncIterable<A>;
    sync(iterable: Iterable<A>): Iterable<A>;
}
export declare function filter<A>(predicate: Predicate<A>): FilterTransducer<A>;
export declare function reject<A>(predicate: Predicate<A>): FilterTransducer<A>;
export declare function find<A>(predicate: Predicate<A>): Transducer<A, A>;
export declare class CompositeTransducer<A, B, C> implements Transducer<A, C> {
    a: Transducer<A, B>;
    b: Transducer<B, C>;
    constructor(a: Transducer<A, B>, b: Transducer<B, C>);
    async_(iterator: AsyncIterable<A>): AsyncIterable<C>;
    sync(iterator: Iterable<A>): Iterable<C>;
}
export declare function compose<A, B, C>(a: Transducer<A, B>, b: Transducer<B, C>): CompositeTransducer<A, B, C>;
export declare function decompose(transducer: Transducer<any, any>): Iterable<Transducer<any, any>>;
export declare class ScanTransducer<A, B> implements Transducer<A, B> {
    reducer: Reducer<A, B>;
    seed: B;
    constructor(reducer: Reducer<A, B>, seed: B);
    async_(iterable: AsyncIterable<A>): AsyncIterable<B>;
    sync(iterable: Iterable<A>): Iterable<B>;
}
export declare function scan<A, B>(reducer: Reducer<A, B>, seed: B): ScanTransducer<A, B>;
export declare function reduce<A, B>(reducer: Reducer<A, B>, seed: B): Transducer<A, B>;
export declare class TakeTransducer<A> implements Transducer<A, A> {
    count: number;
    constructor(count: number);
    async_(iterable: AsyncIterable<A>): AsyncIterable<A>;
    sync(iterable: Iterable<A>): Iterable<A>;
}
export declare function take<A>(count: number): TakeTransducer<A>;
export declare class DropTransducer<A> implements Transducer<A, A> {
    count: number;
    constructor(count: number);
    async_(iterable: AsyncIterable<A>): AsyncIterable<A>;
    sync(iterable: Iterable<A>): Iterable<A>;
}
export declare function drop<A>(count: number): DropTransducer<A>;
export declare class DropWhileTransducer<A> implements Transducer<A, A> {
    predicate: Predicate<A>;
    constructor(predicate: Predicate<A>);
    async_(iterable: AsyncIterable<A>): AsyncIterable<A>;
    sync(iterable: Iterable<A>): Iterable<A>;
}
export declare function dropWhile<A>(predicate: Predicate<A>): DropWhileTransducer<A>;
export declare class TakeWhileTransducer<A> implements Transducer<A, A> {
    predicate: Predicate<A>;
    constructor(predicate: Predicate<A>);
    async_(iterable: AsyncIterable<A>): AsyncIterable<A>;
    sync(iterable: Iterable<A>): Iterable<A>;
}
export declare function takeWhile<T>(predicate: (t: T) => boolean): TakeWhileTransducer<T>;
export declare class SortTransducer<A> implements Transducer<A, A> {
    comparator: Comparator<A>;
    constructor(comparator: Comparator<A>);
    async_(iterable: AsyncIterable<A>): AsyncIterable<A>;
    sync(iterable: Iterable<A>): Iterable<A>;
}
export declare function sort<A>(comparator?: Comparator<A>): SortTransducer<A>;
export declare class DedupTransducer<A> implements Transducer<A, A> {
    comparator: Comparator<A>;
    constructor(comparator: Comparator<A>);
    async_(iterable: AsyncIterable<A>): AsyncIterable<A>;
    sync(iterable: Iterable<A>): Iterable<A>;
}
export declare function dedupe<A>(comparator?: Comparator<A>): DedupTransducer<A>;
export declare class UniqueTransducer<A> implements Transducer<A, A> {
    comparator: Comparator<A>;
    constructor(comparator: Comparator<A>);
    async_(iterable: AsyncIterable<A>): AsyncIterable<A>;
    sync(iterable: Iterable<A>): Iterable<A>;
}
export declare function unique<A>(comparator?: Comparator<A>): DedupTransducer<A>;
export declare function windowed<A>(size: number, step?: number, remainder?: boolean): WindowedTransducer<A>;
export declare class WindowedTransducer<A> implements Transducer<A, A[]> {
    size: number;
    step: number;
    private remainder;
    constructor(size: number, step: number, remainder: boolean);
    async_(iterable: AsyncIterable<A>): AsyncIterable<A[]>;
    sync(iterable: Iterable<A>): Iterable<A[]>;
}
