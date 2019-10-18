import {lazy} from "./lazy";
import {characters} from "./characters";
import {ascending, Comparator, single} from "./collections";
import {AVLTree} from "./avltree";
import {flatMap, map, reduce} from "./transducers";
import {sequence} from "./sequence";

export class TrieFactory<K, V> {
    constructor(public readonly comparator: Comparator<K> = ascending) {
    }

    @lazy get avlTree(): AVLTree<K, Trie<K, V>> {
        return AVLTree.empty(this.comparator);
    }

    @lazy get empty(): Trie<K, V> {
        return new Trie<K, V>(this, undefined, this.avlTree);
    }

    create(value?: V, children: AVLTree<K, Trie<K, V>> = this.avlTree): Trie<K, V> {
        return new Trie<K, V>(this, value, children);
    }

    construct(key: K[], value: V): Trie<K, V> {
        if (key.length === 0) return this.create(value);
        const [head, ...tail] = key;
        return this.create(undefined, this.avlTree.insert(head, this.construct(tail, value)));
    }
}

export class Trie<K, V> {
    constructor(public readonly factory: TrieFactory<K, V> = new TrieFactory<K, V>(),
                public readonly value?: V,
                public readonly children: AVLTree<K, Trie<K, V>> = factory.avlTree) {
    }

    contains(key: K[]): boolean {
        return !!this.lookup(key);
    }

    @lazy get isEmpty(): boolean {
        return !this.value && this.children.isEmpty;
    }

    lookup(key: K[]): V | undefined {
        if (key.length == 0) return this.value;
        const [head, ...tail] = key;
        const child = this.children.lookup(head);
        return child && child.lookup(tail);
    }

    match(key: K[]): V[] {
        if (key.length == 0) return single(this.children.values(), reduce((a, t) => {
            return a.concat(t.match(key));
        }, this.value ? [this.value] : []));
        const [head, ...tail] = key;
        const child = this.children.lookup(head);
        return child ? child.match(tail) : [];
    }

    insert(key: K[], value: V): Trie<K, V> {
        if (key.length === 0) return this.factory.create(value, this.children);
        const [head, ...tail] = key;
        let child = this.children.lookup(head);
        if (child) {
            child = child.insert(tail, value);
        } else {
            child = this.factory.construct(tail, value);
        }

        return this.factory.create(this.value, this.children.insert(head, child));
    }

    delete(key: K[]): Trie<K, V> {
        return this.insert(key, undefined as any);
    }

    entries(): Iterable<Pair<K[], V>> {
        function* recurse<K, V>(prefix: K[], [key, trie]: Pair<K, Trie<K, V>>): Iterable<Pair<K[], V>> {
            prefix = [...prefix, key];
            if (trie.value) yield pair(prefix, trie.value);
            yield* recurseChildren(trie, prefix);
        }

        function recurseChildren<K, V>(trie: Trie<K, V>, prefix: K[]) {
            return sequence(trie.children.entries(), flatMap(entry => recurse(prefix, entry)));
        }

        return recurseChildren(this, []);
    }

    keys(): Iterable<K[]> {
        return sequence(this.entries(), map(([key]) => key));
    }

    values(): Iterable<V> {
        return sequence(this.entries(), map(([, value]) => value));
    }

    @lazy get height(): number {
        return single(this.children.values(), reduce((a, c) => Math.max(a, c.height + 1), 0));
    }

    toString() {
        return (this.value ? `(${this.value})` : '') + this.children;
    }
}

export type Pair<K, V> = [K, V];

export function pair<K, V>(key: K, value: V): Pair<K, V> {
    return [key, value];
}

const IntlComparator = new Intl.Collator(undefined, {usage: 'sort', sensitivity: 'base'}).compare;

export const DEFAULT_COMPARATOR = IntlComparator;

export class PrefixTree<V = string> {
    constructor(private converter = characters,
                private comparator: Comparator<string> = DEFAULT_COMPARATOR,
                private trie = new Trie<string, V>(new TrieFactory<string, V>(comparator))) {
    }

    contains(value: string): boolean {
        return !!this.lookup(value);
    }

    @lazy get isEmpty(): boolean {
        return this.trie.isEmpty;
    }

    match(key: string): V[] {
        return this.trie.match(this.converter(key));
    }

    lookup(key: string): V | undefined {
        return this.trie.lookup(this.converter(key));
    }

    // @ts-ignore
    insert(key: string, value: V = key): PrefixTree<V> {
        return new PrefixTree(this.converter, this.comparator, this.trie.insert(this.converter(key), value));
    }

    delete(value: string): PrefixTree<V> {
        return new PrefixTree(this.converter, this.comparator, this.trie.insert(this.converter(value), undefined as any));
    }

    entries(): Iterable<Pair<string, V>> {
        return sequence(this.trie.entries(), map(([chars, value]) => pair(chars.join(''), value)));
    }

    keys(): Iterable<string> {
        return sequence(this.entries(), map(([key]) => key));
    }

    values(): Iterable<V> {
        return sequence(this.entries(), map(([, value]) => value));
    }

    @lazy get height(): number {
        return this.trie.height;
    }

    search(key: string, maxDist: number): Result<V>[] {
        const empty = Row.create(this.converter(key), this.comparator);

        return single(this.trie.children.entries(), reduce((a: Result<V>[], [letter, value]) => {
            return a.concat(recurse(value, letter, empty, maxDist));
        }, [] as Result<V>[]));
    };
}

function recurse<V>(trie: Trie<string, V>, letter: string, previousRow: Row, maxDist: number): Result<V>[] {
    const currentRow = previousRow.next(letter);

    const result: Result<V>[] = [];

    if (currentRow.distance <= maxDist && trie.value) {
        result.push({value: trie.value, distance: currentRow.distance});
    }

    if (currentRow.minimal <= maxDist) {
        return single(trie.children.entries(), reduce((a, [letter, value]) => {
            return a.concat(recurse(value, letter, currentRow, maxDist));
        }, result));
    }

    return result;
}


export class Row<K = string> {
    private constructor(public keys: K[], public values: number[], private comparator: Comparator<K>) {
    }

    static create<K>(keys: K[], comparator: Comparator<K>): Row<K> {
        const result: number[] = [];
        for (let i = 0; i <= keys.length; i++) {
            result[i] = i;
        }
        return new Row(keys, result, comparator);
    }

    next(key: K): Row<K> {
        const values = this.keys.reduce((result, search, column) => {
            result[column + 1] = this.comparator(search, key) === 0 ?
                this.values[column] :
                1 + Math.min(result[column], this.values[column], this.values[column + 1]);
            return result;
        }, [this.values[0] + 1]);

        return new Row(this.keys, values, this.comparator);
    }

    get distance(): number {
        return this.values[this.keys.length];
    }

    get minimal(): number {
        return Math.min(...this.values);
    }
}

export interface Result<V = string> {
    value: V;
    distance: number;
}

