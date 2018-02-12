import {suite, test} from "mocha-typescript";
import {assert} from 'chai';

@suite
class HelloWorld {
    @test "Does this work"() {
        assert(true);
    }

    another() {

    }
}