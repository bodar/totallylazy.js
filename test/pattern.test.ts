import {assert} from 'chai';
import {get} from "../src/api";
import {match, case_, subset} from "../src/pattern";

describe('Pattern matching', function () {
    it('Can verify a subset of an object', function () {
        assert(subset(get('/some/path'), {method: 'GET'}));
    });

    it('can match', function () {
        const expected = "plain/text";
        const request = get('/some/path', {'Content-Type': expected});

        const actual = match(request,
            case_(get('/some/path'), ({headers: {'Content-Type': type}}) => type)
        );

        assert(actual === expected);
    });
});



