import {characters} from "../src/characters";

class MutableTrie {
    private children: { [letter: string]: MutableTrie } = {};
    private word: string | undefined;

    insert(word: string) {
        let node: MutableTrie = this;
        for (let i = 0; i < word.length; i++) {
            const letter = word.charAt(i);
            let child = node.children[letter];
            if (!child) {
                child = node.children[letter] = new MutableTrie();
            }
            node = child;
        }
        if (node.word !== word) {
            node.word = word;
        }
        return node;
    };

    search(word: string, maxDist: number): Result[] {
        const empty = Row.create(characters(word));

        return Object.keys(this.children).reduce((a, letter) => {
            return a.concat(this.children[letter].searchRecursive(letter, empty, maxDist));
        }, [] as Result[]);
    };

    private searchRecursive(letter: string, previousRow: Row, maxDist: number): Result[] {
        const currentRow = previousRow.next(letter);

        const result = [];

        if (currentRow.distance <= maxDist && this.word) {
            result.push({value: this.word, distance: currentRow.distance});
        }

        if (currentRow.minimal <= maxDist) {
            return Object.keys(this.children).reduce((a, letter) => {
                return a.concat(this.children[letter].searchRecursive(letter, currentRow, maxDist));
            }, result);
        }

        return result;
    }
}




import {assert} from 'chai';
import {Result, Row} from "../src/trie";


describe("Alt Trie", function () {
    it('supports isEmpty', function () {
        // @ts-ignore
        const trie = new MutableTrie();
        trie.insert("Hotel A");
        trie.insert("Hotel AB");
        trie.insert("Some Hotel");

        const search = 'Hotel C';
        const [a, b] = trie.search(search, search.length * .75);
        assert.deepEqual(a, {value: 'Hotel A', distance: 1});
        assert.deepEqual(b, {value: 'Hotel AB', distance: 2});
    });
});