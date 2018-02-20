import {assert} from 'chai';
import {get, post, Request} from "./api";
import {match, case_, isPartial, Pattern, regex, apply, PatternResult} from "./pattern";

describe('pattern matching', function () {
    it('can verify a partial objects values match', function () {
        assert(isPartial(get('/some/path'), {method: 'GET'}));
        assert(isPartial(get('/some/path'), {uri: '/some/path'}));
        assert(!isPartial(get('/some/path'), {method: 'POST'}));
    });

    it('can match against a partial instance', function () {
        assert(match(get('/some/path'),
            case_({uri: '/some/path'} as Partial<Request>, (request) => request.method)) == "GET");
        assert(match(post('/some/path'),
            case_({uri: '/some/path'} as Partial<Request>, (request) => request.method)) == "POST");
    });

    it('can destructure what was matched', function () {
        assert(match(get('/some/path'),
            case_({uri: '/some/path'} as Partial<Request>, ({method}) => method)) == "GET");
    });

    it('type check: pattern instance must match keys and values', function () {
        const pattern: Pattern<Request> = {uri: '/some/path'}
    });

    it('type check: pattern instance values can be RegExp', function () {
        const pattern: Pattern<Request> = {uri: regex(/foo/)}
    });

    it('type check: pattern result instance values can be destructured results of the value', function () {
        const a: PatternResult<Request> = {uri: ['foo','bar']};
        const b: PatternResult<Request> = {uri: {path: ''}};
        const c: PatternResult<Request> = {uri: '/foo/bar'};
    });

    it('regex returns capture groups', function () {
        let groups = regex(/Hello (World)/).matches('Hello World');
        if (groups == undefined) throw new Error();
        assert(groups[0] == 'Hello World');
        assert(groups[1] == 'World');
    });

    it('pattern instance mixes in result', function () {
        const pattern: Pattern<Request> = {uri: regex(/Hello (World)/)};
        const request = get('Hello World');
        const mixed: any = apply(request, pattern);
        assert(mixed.method == 'GET');
        assert(mixed.uri[1] == 'World');
    });

    it('can match against a pattern instance', function () {
        assert(match(get('Hello World'),
            case_({uri: regex(/Hello (World)/)} as Pattern<Request>, ({uri:[,w]}) => w)) == "World");
    });
});