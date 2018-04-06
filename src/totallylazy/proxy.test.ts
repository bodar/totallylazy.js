import {assert} from 'chai';
import {method, on} from "./proxy";

describe("proxy", () => {
    it("", () => {
        class User{
            firstname():string {
                return "dan";
            }
        }


        const m = method(on(User).firstname());
        console.log(m)
    })
});