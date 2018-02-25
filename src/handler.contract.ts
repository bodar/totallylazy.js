import {assert} from 'chai';
import {get, Handler, HostHandler, post} from "./api";

export function handlerContract(factory: () => Promise<Handler>, host = "httpbin.org") {
    before(function () {
        return factory().then((handler: Handler) => {
            this.handler = new HostHandler(handler, host);
        }, () => {
            this.skip();
        });
    });

    it("supports GET", async function () {
        const response = await this.handler.handle(get('/get'));
        assert.equal(response.status, 200);
    });

    it("supports POST", async function () {
        let body = "Hello";
        const response = await this.handler.handle(post('/post', {'Content-Length': String(body.length)}, body));
        assert.equal(response.status, 200);

        let text = await response.body.text();
        assert.equal(JSON.parse(text).data, body);
    });

    it("supports chunked encoding", async function () {
        const response = await this.handler.handle(get('/stream-bytes/10'));
        assert.equal(response.status, 200);

        for await (const chunk of response.body) {
            assert.equal(chunk.data().byteLength, 10);
        }
    });
}
