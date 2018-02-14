import {assert} from 'chai';
import {Request} from "../src/api";
import {match, pattern, subset} from "../src/pattern";

describe('Pattern matching', function () {
    it('Can verify a subset of an object', function () {
        assert(subset({method: 'GET', url: '/some/path'}, {method: 'GET', url: '/some/path'}));
    });

    it('can match', function () {
        const type = "plain/text";
        let request: Request = {method: 'GET', url: '/some/path', headers: {"Content-Type": type}};

        let result = match(request,
            pattern<Request, string | string[]>({
                method: 'GET',
                url: '/some/path'
            }, ({headers} = {}) => {
                return headers['Content-Type'];
            })
        );

        assert(result, 'MATCHED');
    });
});



