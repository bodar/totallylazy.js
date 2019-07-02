import {ascending, Comparator} from "./collections";
import {lazy} from "./lazy";

export interface Result<K, V> {
    tree: AVLTree<K, V>;
    key?: K;
    value?: V;
}

export abstract class AVLTree<K, V> {
    protected constructor(public comparator: Comparator<K>) {
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

    abstract delete(key: K): Result<K, V>;

    abstract removeFirst(): Result<K, V>;

    abstract removeLast(): Result<K, V>;

    abstract toString(): string;

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

    delete(key: K): Result<K, V> {
        return {tree: this};
    }

    removeFirst(): Result<K, V> {
        return {tree: this};
    }

    removeLast(): Result<K, V> {
        return {tree: this};
    }

    toString(): string {
        return '';
    }
}

class Node<K, V> extends AVLTree<K, V> {
    constructor(comparator: Comparator<K>,
                public key: K,
                public value: V,
                public left: AVLTree<K, V>,
                public right: AVLTree<K, V>) {
        super(comparator);
    }

    readonly isEmpty = false;

    insert(key: K, value: V): AVLTree<K, V> {
        const difference: number = this.comparator(key, this.key);
        if (difference == 0) return new Node(this.comparator, key, value, this.left, this.right);
        if (difference < 0) return this.replaceLeft(this.left.insert(key, value));
        return this.replaceRight(this.right.insert(key, value));
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

    delete(key: K): Result<K, V> {
        const difference: number = this.comparator(key, this.key);
        if (difference == 0) {
            if (this.left.isEmpty) return {tree: this.right, key: this.key, value: this.value};
            if (this.right.isEmpty) return {tree: this.left, key: this.key, value: this.value};
            const {tree, key, value} = this.left.removeLast();
            return {
                tree: balance(new Node(this.comparator, key!, value!, tree, this.right)),
                key: this.key,
                value: this.value
            };
        }
        if (difference < 0) {
            const {tree, key: deletedKey, value: deletedValue} = this.left.delete(key);
            return {
                tree: this.replaceLeft(tree),
                key: deletedKey,
                value: deletedValue
            };
        }
        const {tree, key: deletedKey, value: deletedValue} = this.right.delete(key);
        return {
            tree: this.replaceRight(tree),
            key: deletedKey,
            value: deletedValue
        };
    }

    removeFirst(): Result<K, V> {
        if (this.left.isEmpty) return {tree: this.right, key: this.key, value: this.value};
        const {tree, key, value} = this.left.removeFirst();
        return {
            tree: this.replaceLeft(tree),
            key,
            value
        };
    }

    removeLast(): Result<K, V> {
        if (this.right.isEmpty) return {tree: this.left, key: this.key, value: this.value};
        const {tree, key, value} = this.right.removeLast();
        return {
            tree: this.replaceRight(tree),
            key,
            value
        };
    }

    replaceLeft(newLeft: AVLTree<K, V>): Node<K, V> {
        return balance(new Node<K, V>(this.comparator, this.key, this.value, newLeft, this.right));
    }

    replaceRight(newRight: AVLTree<K, V>): Node<K, V> {
        return balance(new Node<K, V>(this.comparator, this.key, this.value, this.left, newRight));
    }

    toString(): string {
        return `(${this.left} ${this.key}=${this.value} ${this.right})`;
    }

    @lazy get balance(): number {
        return this.left.height - this.right.height;
    }

    @lazy get height(): number {
        return Math.max(this.left.height, this.right.height) + 1;
    }
}

// http://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/AVL_Tree_Rebalancing.svg/350px-AVL_Tree_Rebalancing.svg.png
function balance<K, V>(node: Node<K, V>): Node<K, V> {
    const balance = node.balance;
    if (balance == -2) return balanceRight(node);
    if (balance == 2) return balanceLeft(node);
    return node;
}

function balanceLeft<K, V>(node: Node<K, V>): Node<K, V> {
    const balance = node.left.balance;
    if (balance == -1) return balanceLeftRight(node);
    if (balance == 1) return balanceLeftLeft(node);
    return node;
}

function balanceRight<K, V>(node: Node<K, V>): Node<K, V> {
    const balance = node.right.balance;
    if (balance == 1) return balanceRightLeft(node);
    if (balance == -1) return balanceRightRight(node);
    return node;
}

function balanceLeftLeft<K, V>(node: Node<K, V>): Node<K, V> {
    return rotateRight(node);
}

function balanceLeftRight<K, V>(node: Node<K, V>): Node<K, V> {
    const four = rotateLeft(node.left as Node<K, V>);
    return balanceLeftLeft(node.replaceLeft(four));
}

function balanceRightRight<K, V>(node: Node<K, V>): Node<K, V> {
    return rotateLeft(node);
}

function balanceRightLeft<K, V>(node: Node<K, V>): Node<K, V> {
    const four = rotateRight(node.right as Node<K, V>);
    return balanceRightRight(node.replaceRight(four));
}

function rotateLeft<K, V>(node: Node<K, V>): Node<K, V> {
    const right = node.right as Node<K, V>;
    const b = right.left;
    const three = node.replaceRight(b);
    return right.replaceLeft(three);
}

function rotateRight<K, V>(node: Node<K, V>): Node<K, V> {
    const left = node.left as Node<K, V>;
    const c = left.right;
    const five = node.replaceLeft(c);
    return left.replaceRight(five);
}
