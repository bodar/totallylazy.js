import {assert} from 'chai';
import {Request, Headers} from "../src/api";

describe('Select', function () {
    it('Foo', function () {
        let request: Request = {method: 'GET', url: '/some/path'};
        let expected = "MATCHED";
        let actual = match(request,
            pattern({method: 'GET', url: "/some/(path)"}, (arg: { headers: Headers }) => {
            return expected;
        }));
        assert( actual == expected );
    });
});


interface Pattern<T, R> {
    matches(instance: T): R | undefined
}

class SimplePattern<T,R> implements Pattern<T,R>{
    matches(instance: T): R | undefined {
        return undefined;
    }

}

function pattern<T, R>(filter: Partial<T>, handler: (instance:Partial<T>) => R): Pattern<T,R> {
    throw new Error("Unsupported")
}

function match<T, R>(instance: T, patterns: Pattern<T, R>[]): R {
    for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i];
        const result = pattern.matches(instance);
        if (typeof result != 'undefined') return result;
    }
    throw new Error("Non exhaustive matches detected");
}


function old(instance: any, filter: { [name: string]: any | RegExp; }): boolean {
    if (!filter) {
        return true;
    }

    return Object.keys(filter).every(function (key) {
        var expected = filter[key];
        let actual = instance[key];

        if (expected instanceof RegExp && typeof actual == 'string') {
            return expected.test(actual);
        }
        if (expected instanceof Object && actual instanceof Object) {
            return match(actual, expected);
        }
        return filter[key] === actual;
    });
}
