import {assert} from 'chai';
import {get, Handler, post} from "./api";

export function handlerContract(factory: () => Promise<Handler>) {
    before(function () {
        return factory().then( (handler:Handler) => {
            this.handler = handler;
        }, () => {
            this.skip();
        })
    });

    it("supports GET", async function() {
        const response  = await this.handler.handle(get('http://httpbin.org/get'));
        assert.equal(response.status, 200);
    });

    it("supports POST", async function() {
        let body = "Hello";
        const response  = await this.handler.handle(post('http://httpbin.org/post', {'Content-Length': String(body.length)}, body));
        assert.equal(response.status, 200);
        assert.equal(JSON.parse(response.body).data, body);
    });
}
