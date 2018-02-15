import {assert} from 'chai';
import {get, post, Request} from "../src/api";
import {match, case_, isPartial} from "../src/pattern";

describe('pattern matching', function () {
    it('can verify a partial of an object at runtime', function () {
        assert(isPartial(get('/some/path'), {method: 'GET'}));
    });

    it('can match against a partial instance', function () {
        assert(match(get('/some/path'),
            case_({uri: '/some/path'} as Partial<Request>, (request) => request.method)) === "GET");
        assert(match(post('/some/path'),
            case_({uri: '/some/path'} as Partial<Request>, (request) => request.method)) === "POST");

    });

    it('can destructure what was matched', function () {
        assert(match(get('/some/path'),
            case_({uri: '/some/path'} as Partial<Request>, ({method}) => method)) === "GET");
    });
});



