import {ascending, Comparator} from "./collections";
import {lazy} from "./lazy";

export abstract class AVLTree<K, V> {
    protected constructor(protected comparator: Comparator<K>) {
    }

    static empty<K, V>(comparator: Comparator<K> = ascending): AVLTree<K, V> {
        return new Empty<K, V>(comparator);
    }

    static create<K, V>(key: K, value: V, comparator: Comparator<K> = ascending): AVLTree<K, V> {
        return AVLTree.empty<K, V>(comparator).insert(key, value);
    }

    abstract readonly isEmpty: boolean;

    abstract insert(key: K, value: V): AVLTree<K, V>;

    abstract contains(key: K): boolean;

    abstract lookup(key: K): V | undefined;

    abstract readonly height: number;

    abstract readonly balance: number;
}

class Empty<K, V> extends AVLTree<K, V> {
    constructor(comparator: Comparator<K>) {
        super(comparator);
    }

    readonly isEmpty = true;
    readonly height = 0;
    readonly balance = 0;

    insert(key: K, value: V): AVLTree<K, V> {
        return new Node(this.comparator, key, value, this, this);
    }

    contains(key: K): boolean {
        return false
    }

    lookup(key: K): V | undefined {
        return undefined;
    }
}

class Node<K, V> extends AVLTree<K, V> {
    constructor(protected comparator: Comparator<K>,
                protected key: K,
                protected value: V,
                protected left: AVLTree<K, V>,
                protected right: AVLTree<K, V>) {
        super(comparator);
    }

    readonly isEmpty = false;

    insert(key: K, value: V): AVLTree<K, V> {
        const difference: number = this.comparator(key, this.key);
        if (difference == 0) return new Node(this.comparator, key, value, this.left, this.right);
        if (difference < 0) return new Node(this.comparator, this.key, this.value, this.left.insert(key, value), this.right);
        return new Node(this.comparator, this.key, this.value, this.left, this.right.insert(key, value));
    }

    contains(key: K): boolean {
        const difference: number = this.comparator(key, this.key);
        if (difference == 0) return true;
        if (difference < 0) return this.left.contains(key);
        return this.right.contains(key);
    }

    lookup(key: K): V | undefined {
        const difference: number = this.comparator(key, this.key);
        if (difference == 0) return this.value;
        if (difference < 0) return this.left.lookup(key);
        return this.right.lookup(key);
    }

    @lazy get balance(): number {
        return this.left.height - this.right.height;
    }

    @lazy get height(): number {
        return Math.max(this.left.height, this.right.height) + 1;
    }
}
