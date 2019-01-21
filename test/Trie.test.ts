import {assert} from 'chai';
import {prefixTree, Trie} from "../src/Trie";

describe("Trie", function () {
    it('can insert and lookup', function () {
        const trie = prefixTree()
            .insert("to")
            .insert("tea")
            .insert("ted")
            .insert("ten")
            .insert("A")
            .insert("inn");

        assert.deepEqual(trie.lookup('te'), ['tea', 'ted', 'ten'])
    });

});