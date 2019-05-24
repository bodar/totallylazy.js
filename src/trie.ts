import {flatten, unique} from "./arrays";
import {lazy} from "./lazy";
import {characters} from "./characters";

export class Trie<K, V> {
    constructor(public readonly value?: V,
                public readonly children: { [key: string]: Trie<K, V> } = {}) {
    }

    contains(key: K[]): boolean {
        return !!this.lookup(key);
    }

    @lazy get isEmpty(): boolean {
        return !this.value && Object.keys(this.children).length == 0;
    }

    lookup(key: K[]): V | undefined {
        if (key.length == 0) return this.value;
        const [head, ...tail] = key;
        const child = this.childFor(head);
        return child && child.lookup(tail);
    }

    match(key: K[]): V[] {
        if (key.length == 0) return Object.keys(this.children).map(k => this.children[k]).reduce((a, t) => {
            return a.concat(t.match(key));
        }, this.value ? [this.value] : []);
        const [head, ...tail] = key;
        const child = this.childFor(head);
        return child ? child.match(tail) : [];
    }

    insert(key: K[], value: V): Trie<K, V> {
        if (key.length == 0) return new Trie(value, this.children);
        const [head, ...tail] = key;
        const child: Trie<K, V> = (this.childFor(head) || new Trie<K, V>()).insert(tail, value);
        return new Trie(this.value, {...this.children, [head.toString()]: child});
    }

    delete(key: K[]): Trie<K, V> {
        return this.insert(key, undefined as any);
    }

    @lazy get keys(): string[] {
        return unique(flatten(Object.keys(this.children).map(k => ([k, ...this.children[k].keys]))));
    }

    @lazy get height(): number {
        return Object.keys(this.children).map(k => this.children[k]).reduce((a, c) => Math.max(a, c.height + 1), 0);
    }

    private childFor(head: K): Trie<K, V> | undefined {
        return this.children[head.toString()];
    }
}

export class PrefixTree<V = string> {
    constructor(private converter = characters,
                private trie = new Trie<string, V>()) {
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
        return new PrefixTree(this.converter, this.trie.insert(this.converter(key), value));
    }

    delete(value: string): PrefixTree<V> {
        return new PrefixTree(this.converter, this.trie.insert(this.converter(value), undefined as any));
    }

    @lazy get keys(): string[] {
        return this.trie.keys;
    }

    @lazy get height(): number {
        return this.trie.height;
    }

    search(key: string, maxDist: number): Result<V>[] {
        const empty = Row.create(this.converter(key));

        return Object.keys(this.trie.children).reduce((a: Result<V>[], letter: string) => {
            return a.concat(recurse(this.trie.children[letter], letter, empty, maxDist));
        }, [] as Result<V>[]);
    };
}

function recurse<V>(trie: Trie<string, V>, letter: string, previousRow: Row, maxDist: number): Result<V>[] {
    const currentRow = previousRow.next(letter);

    const result: Result<V>[] = [];

    if (currentRow.distance <= maxDist && trie.value) {
        result.push({value: trie.value, distance: currentRow.distance});
    }

    if (currentRow.minimal <= maxDist) {
        return Object.keys(trie.children).reduce((a, letter) => {
            return a.concat(recurse(trie.children[letter], letter, currentRow, maxDist));
        }, result);
    }

    return result;
}


export class Row<K = string> {
    private constructor(private keys: K[], private values: number[]) {
    }

    static create<K>(keys: K[]): Row<K> {
        const result: number[] = [];
        for (let i = 0; i <= keys.length; i++) {
            result[i] = i;
        }
        return new Row(keys, result);
    }

    next(key: K): Row<K> {
        const values = this.keys.reduce((result, search, column) => {
            result[column + 1] = search === key ?
                this.values[column] :
                1 + Math.min(result[column], this.values[column], this.values[column + 1]);
            return result;
        }, [this.values[0] + 1]);

        return new Row(this.keys, values);
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

