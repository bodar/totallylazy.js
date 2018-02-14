import {assert} from 'chai';
import {Request} from "../src/api";

describe('Pattern matching', function () {
    it('Can verify a subset of an object', function () {
        assert(subset({method: 'GET', url: '/some/path'}, {method: 'GET', url: '/some/path'}));
    });

    it('Lets get the types right first', function () {
        let request: Request = {method: 'GET', url: '/some/path'};

        let result = match(request,
            pattern<Request, string>({method: 'GET', url: '/some/path'}, ({headers}) => {
                return 'MATCHED';
            })
        );

        assert(result, 'MATCHED');
    });
});


interface Pattern<T, R> {
    matches(instance: T): R | undefined
}

class SimplePattern<T, R> implements Pattern<T, R> {
    constructor(private filter: Partial<T>, private handler: (instance: Partial<T>) => R) {}

    matches(instance: T): R | undefined {
        if(subset(instance, this.filter)) {
            return this.handler(instance);
        }
        return undefined;
    }

}

function pattern<T, R>(filter: Partial<T>, handler: (instance: Partial<T>) => R): Pattern<T, R> {
    return new SimplePattern(filter, handler)
}

function match<T, R>(instance: T, ...patterns: Pattern<T, R>[]): R {
    for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i];
        const result = pattern.matches(instance);
        if (typeof result != 'undefined') return result;
    }
    throw new Error("Non exhaustive matches detected");
}


function subset(instance: any, filter: { [name: string]: any | RegExp; }): boolean {
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
