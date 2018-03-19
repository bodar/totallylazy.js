import {assert} from 'chai';
import {get, Handler, HostHandler, post} from "./api";

export function handlerContract(factory: () => Promise<Handler>, host = Promise.resolve("eu.httpbin.org")) {
    before(async function () {
        try {
            const handler = await factory();
            this.handler = new HostHandler(handler, await host);
        } catch (e) {
            this.skip();
        }
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
