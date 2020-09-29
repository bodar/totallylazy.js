import {assert} from 'chai';
import {get, post, Request, StringBody, Uri} from "../src/http";
import {apply, case_, isPartial, match, Matched, Pattern, regex} from "../src/pattern";

describe('pattern matching', function () {
    it('can verify a partial objects values match', function () {
        assert(isPartial(get('/some/path'), {method: 'GET'}));
        assert(isPartial(get('/some/path'), {uri: new Uri('/some/path')}));
        assert(!isPartial(get('/some/path'), {method: 'POST'}));
    });

    it('can match against a partial instance', function () {
        assert.equal(match(get('/some/path'),
            case_({uri: new Uri('/some/path')} as Partial<Request>, (request) => request.method)), "GET");
        assert.equal(match(post('/some/path'),
            case_({uri: new Uri('/some/path')} as Partial<Request>, (request) => request.method)), "POST");
    });

    it('is case insensitive when matching', function () {
        const request = {
            method: "GET",
            uri: new Uri('/request/path'),
            headers: {'content-type': 'text/plain'},
        } as Request;
        assert.equal(match(request,
            case_({method: 'GET', headers: {'Content-Type': 'text/plain'}} as Partial<Request>, ({method}) => method)), "GET");
    });

    it('can destructure what was matched', function () {
        assert.equal(match(get('/some/path'),
            case_({uri: new Uri('/some/path')} as Partial<Request>, ({method}) => method)), "GET");
    });

    it('type check: pattern instance must match keys and values', function () {
        const pattern: Pattern<Request> = {uri: new Uri('/some/path')};
    });

    it('type check: pattern instance values can be RegExp', function () {
        const pattern: Pattern<Request> = {method: regex(/(?:GET|POST)/)}
    });

    it('type check: pattern result instance values can be destructured results of the value', function () {
        const a: Matched<Request> = {uri: ['foo', 'bar']};
        const b: Matched<Request> = {uri: {path: ''}};
        const c: Matched<Request> = {uri: new Uri('/foo/bar')};
    });

    it('regex returns capture groups', function () {
        let groups = regex(/Hello (World)/).matches('Hello World');
        if (groups == undefined) throw new Error();
        assert.equal(groups[0], 'World');
    });

    it('pattern instance mixes in result', function () {
        const pattern: Pattern<Request> = {uri: regex(/Hello (World)/)};
        const request = get('Hello World');
        const mixed: any = apply(request, pattern);
        assert.equal(mixed.method, 'GET');
        assert.equal(mixed.uri[0], 'World');
    });

    it('can match against a pattern instance', function () {
        assert.equal(match(get('Hello Dan'),
            case_({uri: regex(/Hello (\w+)/)} as Pattern<Request>, (
                // @ts-ignore
                {uri: [name]}) => name)), "Dan");
    });
});