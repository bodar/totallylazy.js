import { characters } from "./characters";
import { Comparator } from "./collections";
import { AVLTree } from "./avltree";
export declare class TrieFactory<K, V> {
    readonly comparator: Comparator<K>;
    constructor(comparator?: Comparator<K>);
    get avlTree(): AVLTree<K, Trie<K, V>>;
    get empty(): Trie<K, V>;
    create(value?: V, children?: AVLTree<K, Trie<K, V>>): Trie<K, V>;
    construct(key: K[], value: V): Trie<K, V>;
}
export declare class Trie<K, V> {
    readonly factory: TrieFactory<K, V>;
    readonly value?: V | undefined;
    readonly children: AVLTree<K, Trie<K, V>>;
    constructor(factory?: TrieFactory<K, V>, value?: V | undefined, children?: AVLTree<K, Trie<K, V>>);
    contains(key: K[]): boolean;
    get isEmpty(): boolean;
    lookup(key: K[]): V | undefined;
    match(key: K[]): V[];
    insert(key: K[], value: V): Trie<K, V>;
    delete(key: K[]): Trie<K, V>;
    entries(): Iterable<Pair<K[], V>>;
    keys(): Iterable<K[]>;
    values(): Iterable<V>;
    get height(): number;
    toString(): string;
}
export declare type Pair<K, V> = [K, V];
export declare function pair<K, V>(key: K, value: V): Pair<K, V>;
export declare const DEFAULT_COMPARATOR: (x: string, y: string) => number;
export declare class PrefixTree<V = string> {
    private converter;
    private comparator;
    private trie;
    constructor(converter?: typeof characters, comparator?: Comparator<string>, trie?: Trie<string, V>);
    contains(value: string): boolean;
    get isEmpty(): boolean;
    match(key: string): V[];
    lookup(key: string): V | undefined;
    insert(key: string, value?: V): PrefixTree<V>;
    delete(value: string): PrefixTree<V>;
    entries(): Iterable<Pair<string, V>>;
    keys(): Iterable<string>;
    values(): Iterable<V>;
    get height(): number;
    search(key: string, maxDist: number): Result<V>[];
}
export declare class Row<K = string> {
    keys: K[];
    values: number[];
    private comparator;
    private constructor();
    static create<K>(keys: K[], comparator: Comparator<K>): Row<K>;
    next(key: K): Row<K>;
    get distance(): number;
    get minimal(): number;
}
export interface Result<V = string> {
    value: V;
    distance: number;
}
