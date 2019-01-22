import {assert} from 'chai';
import {PrefixTree, Trie} from "../src/trie";

describe("Trie", function () {
    it('supports isEmpty', function () {
        assert.equal(new Trie().isEmpty(), true);
        assert.equal(new Trie().insert(['a'], 'value').isEmpty(), false);
    });

    it('supports contains', function () {
        const key = ['a'];
        assert.equal(new Trie().contains(key), false);
        assert.equal(new Trie().insert(key, 'value').contains(key), true);
    });

    it('supports lookup', function () {
        const keyA = ['a'];
        const valueA = 'valueA';
        const keyB = ['a', 'b'];
        const valueB = 'valueB';
        assert.equal(new Trie().lookup(keyA), undefined);
        assert.equal(new Trie().insert(keyA, valueA).lookup(keyA), valueA);
        assert.equal(new Trie().insert(keyA, valueA).insert(keyB, valueB).lookup(keyB), valueB);
    });

    it('supports match', function () {
        const keyA = ['a'];
        const valueA = 'valueA';
        const keyB = ['a', 'b'];
        const valueB = 'valueB';
        assert.deepEqual(new Trie().match(keyA), []);
        assert.deepEqual(new Trie().insert(keyA, valueA).match(keyA), [valueA]);
        assert.deepEqual(new Trie().insert(keyA, valueA).insert(keyB, valueB).match(keyA), [valueA, valueB]);
    });

    it('supports delete', function () {
        const keyA = ['a'];
        const valueA = 'valueA';
        const keyB = ['a', 'b'];
        const valueB = 'valueB';
        const trie = new Trie().insert(keyA, valueA).insert(keyB, valueB);
        assert.deepEqual(trie.match([]), [valueA, valueB]);
        assert.deepEqual(trie.delete(keyB).match([]), [valueA]);
        assert.deepEqual(trie.delete(keyA).delete(keyB).match([]), []);
    });
});

describe("PrefixTree", function () {
    it('supports isEmpty', function () {
        assert.equal(new PrefixTree().isEmpty(), true);
        assert.equal(new PrefixTree().insert('value').isEmpty(), false);
    });

    it('supports contains', function () {
        const value = 'value';
        assert.equal(new PrefixTree().contains(value), false);
        assert.equal(new PrefixTree().insert(value).contains(value), true);
    });

    it('supports lookup', function () {
        const valueA = 'valueA';
        const valueB = 'valueB';
        assert.equal(new PrefixTree().lookup(valueA), undefined);
        assert.equal(new PrefixTree().insert(valueA).lookup(valueA), valueA);
        assert.equal(new PrefixTree().insert(valueA).insert(valueB).lookup(valueB), valueB);
    });

    it('supports match', function () {
        const valueA = 'valueA';
        const valueB = 'valueB';
        assert.deepEqual(new PrefixTree().match('val'), []);
        assert.deepEqual(new PrefixTree().insert(valueA).match('val'), [valueA]);
        assert.deepEqual(new PrefixTree().insert(valueA).insert(valueB).match('val'), [valueA, valueB]);
    });

    it('supports delete', function () {
        const valueA = 'valueA';
        const valueB = 'valueB';
        const trie = new PrefixTree().insert(valueA).insert(valueB);
        assert.deepEqual(trie.match(""), [valueA, valueB]);
        assert.deepEqual(trie.delete(valueB).match(""), [valueA]);
        assert.deepEqual(trie.delete(valueA).delete(valueB).match(""), []);
    });

    it('value can be a different type', function () {
        const trie = new PrefixTree<number>()
            .insert("январь", 1)
            .insert("января", 1)
            .insert("янв.", 1);

        assert.deepEqual(trie.match('янва'), [1, 1]);
        assert.deepEqual(trie.match('янв'), [1, 1, 1]);
    });

});