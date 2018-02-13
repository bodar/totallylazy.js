import {suite, test} from "mocha-typescript";
import {assert} from 'chai';

@suite
class HelloWorld {
    @test "Does this work"() {
        assert(match({method: 'GET', url: '/some/path'}, {method: 'GET', url: /path$/}))
        assert(!match({method: 'GET', url: 1}, {method: 'GET', url: /path$/}))
        assert(!match({method: 'GET', url: "/some"}, {method: 'GET', url: /path$/}))
    }
}

function match(instance: any, filter: { [name: string]: any | RegExp; }): boolean {
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
