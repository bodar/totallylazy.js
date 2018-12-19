import {assert} from 'chai';
import {call, on} from "../src/proxy";

describe("proxy", () => {
    it("", () => {
        class User {
            firstname(): string {
                return "dan";
            }

            public lastname = "Bod";

            get fullName(): string {
                return this.firstname() + this.lastname;
            }

            private _age:number = 0;
            set age(value: number) {
                this._age = value;
            }
        }

        assert.deepEqual(call(on(User).firstname().length), ['firstname', [], 'length']);
        assert.deepEqual(call(on(User).lastname), ['lastname']);
        assert.deepEqual(call(on(User).fullName), ['fullName']);
        assert.deepEqual(call(on(User).age = 30), ['age', 30]);
    })
});