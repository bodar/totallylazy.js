import {assert} from 'chai';
import {Chunk, get, Handler, post, StringBody} from "./api";

export function handlerContract(factory: () => Promise<Handler>) {
    before(function () {
        return factory().then((handler: Handler) => {
            this.handler = handler;
        }, () => {
            this.skip();
        })
    });

    it("supports GET", async function () {
        const response = await this.handler.handle(get('http://httpbin.org/get'));
        assert.equal(response.status, 200);
    });

    it("supports POST", async function () {
        let body = "Hello";
        const response = await this.handler.handle(post('http://httpbin.org/post', {'Content-Length': String(body.length)}, new StringBody(body)));
        assert.equal(response.status, 200);

        assert.equal(JSON.parse(response.body.text()).data, body);
    });

    it("supports chunked encoding", async function () {
        const response = await this.handler.handle(get('http://httpbin.org/stream-bytes/10?chunk_size=5'));
        assert.equal(response.status, 200);

        for await (const chunk of response.body) {
            assert.equal(chunk.text().length, 5);
        }
    });
}
