import {assert} from 'chai';
import {call, on} from "./proxy";

describe("proxy", () => {
    it("", () => {
        class User{
            firstname():string {
                return "dan";
            }

            public lastname = "Bod"
        }


        const m = call(on(User).firstname().length);
        console.log(m)
    })
});