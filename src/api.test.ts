import {Uri} from './api';
import {assert} from 'chai';

describe('Uri', function() {
    describe('implements RFC 3986', function() {
        it('can parse example from: https://tools.ietf.org/html/rfc3986#page-50', function() {
            const uri = new Uri('http://www.ics.uci.edu/pub/ietf/uri/#Related');
            assert.equal(uri.scheme, 'http');
            assert.equal(uri.authority, 'www.ics.uci.edu');
            assert.equal(uri.path, '/pub/ietf/uri/');
            assert.equal(uri.query, undefined);
            assert.equal(uri.fragment, 'Related');
        });

        it('supports toString()', function() {
            const original = 'http://www.ics.uci.edu/pub/ietf/uri/#Related';
            assert.equal(new Uri(original).toString(), original);
        });
    });
});