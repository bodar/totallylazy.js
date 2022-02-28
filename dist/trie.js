"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Row = exports.PrefixTree = exports.DEFAULT_COMPARATOR = exports.pair = exports.Trie = exports.TrieFactory = void 0;
const tslib_1 = require("tslib");
const lazy_1 = require("./lazy");
const characters_1 = require("./characters");
const collections_1 = require("./collections");
const avltree_1 = require("./avltree");
const transducers_1 = require("./transducers");
const sequence_1 = require("./sequence");
class TrieFactory {
    constructor(comparator = collections_1.ascending) {
        this.comparator = comparator;
    }
    get avlTree() {
        return avltree_1.AVLTree.empty(this.comparator);
    }
    get empty() {
        return new Trie(this, undefined, this.avlTree);
    }
    create(value, children = this.avlTree) {
        return new Trie(this, value, children);
    }
    construct(key, value) {
        if (key.length === 0)
            return this.create(value);
        const [head, ...tail] = key;
        return this.create(undefined, this.avlTree.insert(head, this.construct(tail, value)));
    }
}
(0, tslib_1.__decorate)([
    lazy_1.lazy
], TrieFactory.prototype, "avlTree", null);
(0, tslib_1.__decorate)([
    lazy_1.lazy
], TrieFactory.prototype, "empty", null);
exports.TrieFactory = TrieFactory;
class Trie {
    constructor(factory = new TrieFactory(), value, children = factory.avlTree) {
        this.factory = factory;
        this.value = value;
        this.children = children;
    }
    contains(key) {
        return !!this.lookup(key);
    }
    get isEmpty() {
        return !this.value && this.children.isEmpty;
    }
    lookup(key) {
        if (key.length == 0)
            return this.value;
        const [head, ...tail] = key;
        const child = this.children.lookup(head);
        return child && child.lookup(tail);
    }
    match(key) {
        if (key.length == 0)
            return (0, collections_1.single)(this.children.values(), (0, transducers_1.reduce)((a, t) => {
                return a.concat(t.match(key));
            }, this.value ? [this.value] : []));
        const [head, ...tail] = key;
        const child = this.children.lookup(head);
        return child ? child.match(tail) : [];
    }
    insert(key, value) {
        if (key.length === 0)
            return this.factory.create(value, this.children);
        const [head, ...tail] = key;
        let child = this.children.lookup(head);
        if (child) {
            child = child.insert(tail, value);
        }
        else {
            child = this.factory.construct(tail, value);
        }
        return this.factory.create(this.value, this.children.insert(head, child));
    }
    delete(key) {
        return this.insert(key, undefined);
    }
    entries() {
        function* recurse(prefix, [key, trie]) {
            prefix = [...prefix, key];
            if (trie.value)
                yield pair(prefix, trie.value);
            yield* recurseChildren(trie, prefix);
        }
        function recurseChildren(trie, prefix) {
            return (0, sequence_1.sequence)(trie.children.entries(), (0, transducers_1.flatMap)(entry => recurse(prefix, entry)));
        }
        return recurseChildren(this, []);
    }
    keys() {
        return (0, sequence_1.sequence)(this.entries(), (0, transducers_1.map)(([key]) => key));
    }
    values() {
        return (0, sequence_1.sequence)(this.entries(), (0, transducers_1.map)(([, value]) => value));
    }
    get height() {
        return (0, collections_1.single)(this.children.values(), (0, transducers_1.reduce)((a, c) => Math.max(a, c.height + 1), 0));
    }
    toString() {
        return (this.value ? `(${this.value})` : '') + this.children;
    }
}
(0, tslib_1.__decorate)([
    lazy_1.lazy
], Trie.prototype, "isEmpty", null);
(0, tslib_1.__decorate)([
    lazy_1.lazy
], Trie.prototype, "height", null);
exports.Trie = Trie;
function pair(key, value) {
    return [key, value];
}
exports.pair = pair;
const IntlComparator = new Intl.Collator(undefined, { usage: 'sort', sensitivity: 'base' }).compare;
exports.DEFAULT_COMPARATOR = IntlComparator;
class PrefixTree {
    constructor(converter = characters_1.characters, comparator = exports.DEFAULT_COMPARATOR, trie = new Trie(new TrieFactory(comparator))) {
        this.converter = converter;
        this.comparator = comparator;
        this.trie = trie;
    }
    contains(value) {
        return !!this.lookup(value);
    }
    get isEmpty() {
        return this.trie.isEmpty;
    }
    match(key) {
        return this.trie.match(this.converter(key));
    }
    lookup(key) {
        return this.trie.lookup(this.converter(key));
    }
    // @ts-ignore
    insert(key, value = key) {
        return new PrefixTree(this.converter, this.comparator, this.trie.insert(this.converter(key), value));
    }
    delete(value) {
        return new PrefixTree(this.converter, this.comparator, this.trie.insert(this.converter(value), undefined));
    }
    entries() {
        return (0, sequence_1.sequence)(this.trie.entries(), (0, transducers_1.map)(([chars, value]) => pair(chars.join(''), value)));
    }
    keys() {
        return (0, sequence_1.sequence)(this.entries(), (0, transducers_1.map)(([key]) => key));
    }
    values() {
        return (0, sequence_1.sequence)(this.entries(), (0, transducers_1.map)(([, value]) => value));
    }
    get height() {
        return this.trie.height;
    }
    search(key, maxDist) {
        const empty = Row.create(this.converter(key), this.comparator);
        return (0, collections_1.single)(this.trie.children.entries(), (0, transducers_1.reduce)((a, [letter, value]) => {
            return a.concat(recurse(value, letter, empty, maxDist));
        }, []));
    }
    ;
}
(0, tslib_1.__decorate)([
    lazy_1.lazy
], PrefixTree.prototype, "isEmpty", null);
(0, tslib_1.__decorate)([
    lazy_1.lazy
], PrefixTree.prototype, "height", null);
exports.PrefixTree = PrefixTree;
function recurse(trie, letter, previousRow, maxDist) {
    const currentRow = previousRow.next(letter);
    const result = [];
    if (currentRow.distance <= maxDist && trie.value) {
        result.push({ value: trie.value, distance: currentRow.distance });
    }
    if (currentRow.minimal <= maxDist) {
        return (0, collections_1.single)(trie.children.entries(), (0, transducers_1.reduce)((a, [letter, value]) => {
            return a.concat(recurse(value, letter, currentRow, maxDist));
        }, result));
    }
    return result;
}
class Row {
    constructor(keys, values, comparator) {
        this.keys = keys;
        this.values = values;
        this.comparator = comparator;
    }
    static create(keys, comparator) {
        const result = [];
        for (let i = 0; i <= keys.length; i++) {
            result[i] = i;
        }
        return new Row(keys, result, comparator);
    }
    next(key) {
        const values = this.keys.reduce((result, search, column) => {
            result[column + 1] = this.comparator(search, key) === 0 ?
                this.values[column] :
                1 + Math.min(result[column], this.values[column], this.values[column + 1]);
            return result;
        }, [this.values[0] + 1]);
        return new Row(this.keys, values, this.comparator);
    }
    get distance() {
        return this.values[this.keys.length];
    }
    get minimal() {
        return Math.min(...this.values);
    }
}
exports.Row = Row;
//# sourceMappingURL=trie.js.map