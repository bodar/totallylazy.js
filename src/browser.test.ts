import {suite, test} from "mocha-typescript";
import {assert} from 'chai';

@suite
class HelloWorld {
    @test "Does this work"() {
        class Status extends Number {
            constructor(code: number, private _description:string) {
                super(code);
            }

            get description():string {
                return this._description;
            }

        }
        let status = new Status(200, "OK");
        assert(status.valueOf() == 200)
    }

    another() {

    }
}