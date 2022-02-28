import { Comparator } from "./collections";
export interface Result<K, V> {
    tree: AVLTree<K, V>;
    key?: K;
    value?: V;
}
export declare abstract class AVLTree<K, V> {
    comparator: Comparator<K>;
    protected constructor(comparator: Comparator<K>);
    static empty<K, V>(comparator?: Comparator<K>): AVLTree<K, V>;
    static create<K, V>(key: K, value: V, comparator?: Comparator<K>): AVLTree<K, V>;
    static of<K, V>(entries: [K, V][], comparator?: Comparator<K>): AVLTree<K, V>;
    private static preSorted;
    abstract readonly isEmpty: boolean;
    abstract insert(key: K, value: V): AVLTree<K, V>;
    abstract contains(key: K): boolean;
    abstract lookup(key: K): V | undefined;
    abstract delete(key: K): Result<K, V>;
    abstract first(): V | undefined;
    abstract last(): V | undefined;
    abstract removeFirst(): Result<K, V>;
    abstract removeLast(): Result<K, V>;
    abstract toString(): string;
    abstract readonly height: number;
    abstract readonly balance: number;
    abstract keys(): Iterable<K>;
    abstract values(): Iterable<V>;
    abstract entries(): Iterable<[K, V]>;
}
