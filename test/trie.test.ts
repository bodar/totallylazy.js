import {assert} from 'chai';
import {DEFAULT_COMPARATOR, PrefixTree, Row, Trie} from "../src/trie";
import {characters} from "../src/characters";

describe("Trie", function () {
    it('supports isEmpty', function () {
        assert.equal(new Trie().isEmpty, true);
        assert.equal(new Trie().insert(['a'], 'value').isEmpty, false);
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

    it('supports keys', function () {
        const trie = new Trie().insert(['a'], 'valueA').insert(['a', 'b'], 'valueB').insert(['c', 'a', 'd'], 'valueB');
        assert.deepEqual(trie.keys, ['a', 'b', 'c', 'd']);
    });
});

describe("PrefixTree", function () {
    it('supports isEmpty', function () {
        assert.equal(new PrefixTree().isEmpty, true);
        assert.equal(new PrefixTree().insert('value').isEmpty, false);
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

    it('can get characters', function () {
        const trie = new PrefixTree<number>()
            .insert("январь", 1)
            .insert("января", 1)
            .insert("янв.", 1);

        assert.includeMembers(trie.keys, ['я', 'н', 'в', 'а', 'р', 'ь', '.']);
    });

    it('can get height', function () {
        assert.deepEqual(new PrefixTree<number>().height, 0);
        assert.deepEqual(new PrefixTree<number>().insert("1", 1).height, 1);
        assert.deepEqual(new PrefixTree<number>().insert("12", 1).height, 2);
        assert.deepEqual(new PrefixTree<number>().insert("123", 1).height, 3);
        assert.deepEqual(new PrefixTree<number>().insert("1234", 1).height, 4);
    });

    it('can search with levenshtein distance', function () {
        const trie = new PrefixTree()
            .insert("Hotel A")
            .insert("Hotel AB")
            .insert("Some Hotel");

        const search = 'Hotel C';
        const [a, b] = trie.search(search, search.length * .75);
        assert.deepEqual(a, {value: 'Hotel A', distance: 1});
        assert.deepEqual(b, {value: 'Hotel AB', distance: 2});
    });

    it('the default search ignores case and language specific accents', function () {
        // https://github.com/hiddentao/fast-levenshtein/issues/7
        const trie = new PrefixTree()
            .insert("Mikhaïlovitch")
            .insert("Vikhaklovitch");

        const search = 'mikailovitch';
        const [a, b] = trie.search(search, 3);
        assert.deepEqual(a, {value: 'Mikhaïlovitch', distance: 1});
        assert.deepEqual(b, {value: 'Vikhaklovitch', distance: 3});
    });

    it('the default match also ignores case and language specific accents', function () {
        const trie = new PrefixTree()
            .insert("Mikhaïlovitch")
            .insert("Vikhaklovitch");

        assert.deepEqual(trie.match('mikhail'), ['Mikhaïlovitch']);
    });

});

describe("Row", function () {
    it('matches the wikipedia example for kitten vs sitting', function () {
        /*
        https://en.wikipedia.org/wiki/Levenshtein_distance
		k	i	t	t	e	n
	0	1	2	3	4	5	6
s	1	1	2	3	4	5	6
i	2	2	1	2	3	4	5
t	3	3	2	1	2	3	4
t	4	4	3	2	1	2	3
i	5	5	4	3	2	2	3
n	6	6	5	4	3	3	2
g	7	7	6	5	4	4	3
         */
        let row = Row.create(characters('kitten'), DEFAULT_COMPARATOR);
        assert.deepEqual(row.values, [0, 1, 2, 3, 4, 5, 6]);
        row = row.next('s');
        assert.deepEqual(row.values, [1, 1, 2, 3, 4, 5, 6]);
        row = row.next('i');
        assert.deepEqual(row.values, [2, 2, 1, 2, 3, 4, 5]);
        row = row.next('t');
        assert.deepEqual(row.values, [3, 3, 2, 1, 2, 3, 4]);
        row = row.next('t');
        assert.deepEqual(row.values, [4, 4, 3, 2, 1, 2, 3]);
        row = row.next('i');
        assert.deepEqual(row.values, [5, 5, 4, 3, 2, 2, 3]);
        row = row.next('n');
        assert.deepEqual(row.values, [6, 6, 5, 4, 3, 3, 2]);
        row = row.next('g');
        assert.deepEqual(row.values, [7, 7, 6, 5, 4, 4, 3]);
    });


});