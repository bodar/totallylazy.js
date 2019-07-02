import {assert} from 'chai';
import {AVLTree} from "../src/avltree";

describe("AVLTree", function () {
    const tree = AVLTree.empty<string, string>();

    it('supports isEmpty', function () {
        assert.equal(tree.isEmpty, true);
        assert.equal(AVLTree.create('a', 'value').isEmpty, false);
    });

    it('supports contains', function () {
        const key = 'a';
        assert.equal(tree.contains(key), false);
        assert.equal(AVLTree.create('a', 'value').contains(key), true);
    });

    it('supports lookup', function () {
        const keyA = 'a';
        const valueA = 'valueA';
        const keyB = 'b';
        const valueB = 'valueB';
        assert.equal(tree.lookup(keyA), undefined);
        assert.equal(tree.insert(keyA, valueA).lookup(keyA), valueA);
        assert.equal(tree.insert(keyA, valueA).insert(keyB, valueB).lookup(keyB), valueB);
    });

    it('supports delete', function () {
        const keyA = 'a';
        const valueA = 'valueA';
        const keyB = 'b';
        const valueB = 'valueB';
        const t = tree.insert(keyA, valueA).insert(keyB, valueB);
        assert.isTrue(t.contains('a'));
        assert.isTrue(t.contains('b'));
        assert.isTrue(t.delete(keyB).tree.contains('a'));
        assert.isFalse(t.delete(keyA).tree.delete(keyB).tree.contains('a'));
    });
});