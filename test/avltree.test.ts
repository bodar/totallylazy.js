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

    it('balances right right case', function () {
        const tree = AVLTree.empty<number, null>();
        assert.equal(tree.insert(3, null).insert(4, null).insert(5, null).toString(), "(( 3=null ) 4=null ( 5=null ))");
    });

    it('balances right left case', function () {
        const tree = AVLTree.empty<number, null>();
        assert.equal(tree.insert(3, null).insert(5, null).insert(4, null).toString(), "(( 3=null ) 4=null ( 5=null ))");
    });

    it('balances left left case', function () {
        const tree = AVLTree.empty<number, null>();
        assert.equal(tree.insert(5, null).insert(4, null).insert(3, null).toString(), "(( 3=null ) 4=null ( 5=null ))");
    });

    it('balances left right case', function () {
        const tree = AVLTree.empty<number, null>();
        assert.equal(tree.insert(5, null).insert(3, null).insert(4, null).toString(), "(( 3=null ) 4=null ( 5=null ))");
    });

    it('balances deletion', function () {
        const tree = AVLTree.empty<number, null>();
        assert.equal(tree.insert(0, null).insert(1, null).insert(2, null)
            .insert(3, null).insert(4, null).insert(5, null).insert(6, null)
            .delete(3).tree.toString(), "((( 0=null ) 1=null ) 2=null (( 4=null ) 5=null ( 6=null )))");
    });
});