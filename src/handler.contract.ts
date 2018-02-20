import {assert} from 'chai';
import {get, Handler} from "./api";

export function handlerContract(factory: () => Promise<Handler>) {
    before(function () {
        return factory().then( (handler:Handler) => {
            this.handler = handler;
        }, () => {
            this.skip();
        })
    });

    it("supports simple GET", async function() {
        const response  = await this.handler.handle(get('http://httpbin.org/'));
        assert(response.status == 200);
    });
}
