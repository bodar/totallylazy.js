import {assert} from 'chai';
import {characters} from "../src/characters";
import {combine, followedBy, is, then, transduce, tuple, values} from "../src/combinators";
import {map} from "../src/transducers";


describe('Combinators', () => {
    it('can match an element', () => {
        const {value, remainder} = is('a').parse(characters('abc'));
        assert.equal(value, 'a');
        assert.deepEqual(remainder, ['b', 'c']);
    });

    it('can transduce', () => {
        const {value, remainder} = transduce(is('a'), map<string, number>(v => v.length)).parse(characters('abc'));
        assert.equal(value, 1);
        assert.deepEqual(remainder, ['b', 'c']);
    });

    it('can combine into tuples', () => {
        const {value, remainder} = tuple(is('a'), is('b')).parse(characters('abc'));
        assert.deepEqual(value, ['a', 'b']);
        assert.deepEqual(remainder, ['c']);
    });

    it('can compose', () => {
        const {value, remainder} = combine(is('a'), then(is('b'))).parse(characters('abc'));
        assert.deepEqual(value, ['a', 'b']);
        assert.deepEqual(remainder, ['c']);
    });

    it('supports followedBy', () => {
        const {value, remainder} = combine(values(characters('https')), followedBy(is(':'))).parse(characters('https://host'));
        assert.deepEqual(value, characters('https'));
        assert.deepEqual(remainder, characters('//host'));
    });
});