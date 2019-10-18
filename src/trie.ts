import {flatten, unique} from "./arrays";
import {lazy} from "./lazy";
import {characters} from "./characters";
import {array, ascending, Comparator, single} from "./collections";
import {AVLTree} from "./avltree";
import {reduce} from "./transducers";

export class Trie<K, V> {
    constructor(public readonly comparator: Comparator<K> = ascending,
                public readonly value?: V,
                public readonly children: AVLTree<K, Trie<K, V>> = AVLTree.empty(comparator)) {
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
        if (key.length == 0) return new Trie(this.comparator, value, this.children);
        const [head, ...tail] = key;
        const child: Trie<K, V> = (this.children.lookup(head) || new Trie<K, V>(this.comparator)).insert(tail, value);
        return new Trie(this.comparator, this.value, this.children.insert(head, child));
    }

    delete(key: K[]): Trie<K, V> {
        return this.insert(key, undefined as any);
    }

    @lazy get keys(): K[] {
        return unique(flatten(array(this.children.entries()).map(([k, v]) => ([k, ...v.keys]))));
    }

    @lazy get height(): number {
        return single(this.children.values(), reduce((a, c) => Math.max(a, c.height + 1), 0));
    }
}

const IntlComparator = new Intl.Collator(undefined, {usage: 'sort', sensitivity: 'base'}).compare;

export const DEFAULT_COMPARATOR = IntlComparator;

export class PrefixTree<V = string> {
    constructor(private converter = characters,
                private comparator: Comparator<string> = DEFAULT_COMPARATOR,
                private trie = new Trie<string, V>(comparator)) {
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

    @lazy get keys(): string[] {
        return this.trie.keys;
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

