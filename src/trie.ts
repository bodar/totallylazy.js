import {flatten, unique} from "./arrays";
import {lazy} from "./lazy";
import {characters} from "./characters";

export class Trie<K, V> {
    constructor(public readonly value?: V,
                private readonly children: { [key: string]: Trie<K, V> } = {}) {
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
        if (key.length == 0) return Object.values(this.children).reduce((a, t) => {
            return a.concat(t.match(key));
        }, this.value ? [this.value] : []);
        const [head, ...tail] = key;
        const child = this.childFor(head);
        return child ? child.match(tail) : [];
    }

    insert(key: K[], value: V): Trie<K, V> {
        if (key.length == 0) return new Trie(value, this.children);
        const [head, ...tail] = key;
        const child: Trie<K, V> = (this.childFor(head) || new Trie<K,V>()).insert(tail, value);
        return new Trie(this.value, {...this.children, [head.toString()]: child});
    }

    delete(key: K[]): Trie<K, V> {
        return this.insert(key, undefined as any);
    }

    @lazy get keys():string[]{
        return unique(flatten(Object.keys(this.children).map(k => ([k, ...this.children[k].keys]))));
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

    delete(value: string): PrefixTree<V>  {
        return new PrefixTree(this.converter, this.trie.insert(this.converter(value), undefined as any));
    }

    @lazy get keys():string[]{
        return this.trie.keys;
    }
}

