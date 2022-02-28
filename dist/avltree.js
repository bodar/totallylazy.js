"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AVLTree = void 0;
const tslib_1 = require("tslib");
const collections_1 = require("./collections");
const lazy_1 = require("./lazy");
class AVLTree {
    constructor(comparator) {
        this.comparator = comparator;
    }
    static empty(comparator = collections_1.ascending) {
        return new Empty(comparator);
    }
    static create(key, value, comparator = collections_1.ascending) {
        const empty = AVLTree.empty(comparator);
        return new Node(comparator, key, value, empty, empty);
    }
    static of(entries, comparator = collections_1.ascending) {
        return AVLTree.preSorted(entries.sort((0, collections_1.by)(0)), comparator, AVLTree.empty(comparator));
    }
    static preSorted(entries, comparator, empty) {
        const length = entries.length;
        switch (length) {
            case 0:
                return empty;
            case 1: {
                const [[key, value]] = entries;
                return new Node(comparator, key, value, empty, empty);
            }
            default: {
                const mid = Math.floor(length / 2);
                const left = AVLTree.preSorted(entries.slice(0, mid), comparator, empty);
                const right = AVLTree.preSorted(entries.slice(mid + 1), comparator, empty);
                const [key, value] = entries[mid];
                return new Node(comparator, key, value, left, right);
            }
        }
    }
}
exports.AVLTree = AVLTree;
class Empty extends AVLTree {
    constructor(comparator) {
        super(comparator);
        this.isEmpty = true;
        this.height = 0;
        this.balance = 0;
    }
    insert(key, value) {
        return new Node(this.comparator, key, value, this, this);
    }
    contains(key) {
        return false;
    }
    lookup(key) {
        return undefined;
    }
    delete(key) {
        return { tree: this };
    }
    first() {
        return undefined;
    }
    last() {
        return undefined;
    }
    removeFirst() {
        return { tree: this };
    }
    removeLast() {
        return { tree: this };
    }
    toString() {
        return '';
    }
    *keys() {
        return;
    }
    *values() {
        return;
    }
    *entries() {
        return [];
    }
}
class Node extends AVLTree {
    constructor(comparator, key, value, left, right) {
        super(comparator);
        this.key = key;
        this.value = value;
        this.left = left;
        this.right = right;
        this.isEmpty = false;
    }
    insert(key, value) {
        const difference = this.comparator(key, this.key);
        if (difference === 0)
            return new Node(this.comparator, key, value, this.left, this.right);
        if (difference < 0)
            return this.replaceLeft(this.left.insert(key, value));
        return this.replaceRight(this.right.insert(key, value));
    }
    contains(key) {
        const difference = this.comparator(key, this.key);
        if (difference === 0)
            return true;
        if (difference < 0)
            return this.left.contains(key);
        return this.right.contains(key);
    }
    lookup(key) {
        const difference = this.comparator(key, this.key);
        if (difference === 0)
            return this.value;
        if (difference < 0)
            return this.left.lookup(key);
        return this.right.lookup(key);
    }
    delete(key) {
        const difference = this.comparator(key, this.key);
        if (difference === 0) {
            if (this.left.isEmpty)
                return { tree: this.right, key: this.key, value: this.value };
            if (this.right.isEmpty)
                return { tree: this.left, key: this.key, value: this.value };
            const { tree, key, value } = this.left.removeLast();
            return {
                tree: balance(new Node(this.comparator, key, value, tree, this.right)),
                key: this.key,
                value: this.value
            };
        }
        if (difference < 0) {
            const { tree, key: deletedKey, value: deletedValue } = this.left.delete(key);
            return {
                tree: this.replaceLeft(tree),
                key: deletedKey,
                value: deletedValue
            };
        }
        const { tree, key: deletedKey, value: deletedValue } = this.right.delete(key);
        return {
            tree: this.replaceRight(tree),
            key: deletedKey,
            value: deletedValue
        };
    }
    first() {
        if (this.left.isEmpty)
            return this.value;
        return this.left.first();
    }
    last() {
        if (this.right.isEmpty)
            return this.value;
        return this.right.last();
    }
    removeFirst() {
        if (this.left.isEmpty)
            return { tree: this.right, key: this.key, value: this.value };
        const { tree, key, value } = this.left.removeFirst();
        return {
            tree: this.replaceLeft(tree),
            key,
            value
        };
    }
    removeLast() {
        if (this.right.isEmpty)
            return { tree: this.left, key: this.key, value: this.value };
        const { tree, key, value } = this.right.removeLast();
        return {
            tree: this.replaceRight(tree),
            key,
            value
        };
    }
    replaceLeft(newLeft) {
        return balance(new Node(this.comparator, this.key, this.value, newLeft, this.right));
    }
    replaceRight(newRight) {
        return balance(new Node(this.comparator, this.key, this.value, this.left, newRight));
    }
    toString() {
        return `(${this.left} ${this.key}=${this.value} ${this.right})`;
    }
    get balance() {
        return this.left.height - this.right.height;
    }
    get height() {
        return Math.max(this.left.height, this.right.height) + 1;
    }
    *keys() {
        yield* this.left.keys();
        yield this.key;
        yield* this.right.keys();
    }
    *values() {
        yield* this.left.values();
        yield this.value;
        yield* this.right.values();
    }
    *entries() {
        yield* this.left.entries();
        yield [this.key, this.value];
        yield* this.right.entries();
    }
}
(0, tslib_1.__decorate)([
    lazy_1.lazy
], Node.prototype, "balance", null);
(0, tslib_1.__decorate)([
    lazy_1.lazy
], Node.prototype, "height", null);
// http://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/AVL_Tree_Rebalancing.svg/350px-AVL_Tree_Rebalancing.svg.png
function balance(node) {
    const balance = node.balance;
    if (balance == -2)
        return balanceRight(node);
    if (balance == 2)
        return balanceLeft(node);
    return node;
}
function balanceLeft(node) {
    const balance = node.left.balance;
    if (balance == -1)
        return balanceLeftRight(node);
    if (balance == 1)
        return balanceLeftLeft(node);
    return node;
}
function balanceRight(node) {
    const balance = node.right.balance;
    if (balance == 1)
        return balanceRightLeft(node);
    if (balance == -1)
        return balanceRightRight(node);
    return node;
}
function balanceLeftLeft(node) {
    return rotateRight(node);
}
function balanceLeftRight(node) {
    const four = rotateLeft(node.left);
    return balanceLeftLeft(node.replaceLeft(four));
}
function balanceRightRight(node) {
    return rotateLeft(node);
}
function balanceRightLeft(node) {
    const four = rotateRight(node.right);
    return balanceRightRight(node.replaceRight(four));
}
function rotateLeft(node) {
    const right = node.right;
    const b = right.left;
    const three = node.replaceRight(b);
    return right.replaceLeft(three);
}
function rotateRight(node) {
    const left = node.left;
    const c = left.right;
    const five = node.replaceLeft(c);
    return left.replaceRight(five);
}
//# sourceMappingURL=avltree.js.map