export interface Converter<K, V> {
    (value: V): K[];
}

export class Trie<K extends string, V> {
    constructor(private converter: Converter<K, V>,
                public value?: V,
                private children: { [key: string]: Trie<K, V> } = {}) {
    }

    contains(value: V): boolean {
        return !!this.get(this.converter(value));
    }

    lookup(value: V): V[] {
        return this.values(this.converter(value));
    }

    insert(value: V): Trie<K, V> {
        return this.put(this.converter(value), value);
    }

    delete(value: V): Trie<K, V> {
        return this.put(this.converter(value), undefined);
    }

    isEmpty(): boolean {
        return !this.value && Object.keys(this.children).length == 0;
    }

    private values(key: K[]): V[] {
        if (key.length == 0) {
            return Object.values(this.children).reduce((a, t) => {
                return a.concat(t.values(key));
            }, this.value ? [this.value] : []);
        }
        const [head, ...tail] = key;
        const child = this.childFor(head);
        return child ? child.values(tail) : [];
    }

    private get(key: K[]): V | undefined {
        if (key.length == 0) return this.value;
        const [head, ...tail] = key;
        const child = this.childFor(head);
        return child && child.get(tail);
    }

    private put(key: K[], value?: V): Trie<K, V> {
        if (key.length == 0) return new Trie(this.converter, value, this.children);
        const [head, ...tail] = key;
        const child = (this.childFor(head) || new Trie(this.converter)).put(tail, value);
        return new Trie(this.converter, this.value, {...this.children, [head]: child});
    }

    private childFor(head: K): Trie<K, V> | undefined {
        return this.children[head];
    }
}

export function prefixTree(): Trie<string, string> {
    return new Trie(v => [...v]);
} 
