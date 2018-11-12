import {assert} from 'chai';
import {delete_, get, Handler, HostHandler, patch, post, put} from ".";

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
        const body = "Hello";
        const response = await this.handler.handle(post('/post', {'Content-Length': String(body.length)}, body));
        assert.equal(response.status, 200);

        const text = await response.body.text();
        assert.equal(JSON.parse(text).data, body);
    });

    it("supports PUT", async function () {
        const body = "Hello";
        const response = await this.handler.handle(put('/put', {'Content-Length': String(body.length)}, body));
        assert.equal(response.status, 200);

        const text = await response.body.text();
        assert.equal(JSON.parse(text).data, body);
    });

    it("supports PATCH", async function () {
        const body = "Hello";
        const response = await this.handler.handle(patch('/patch', {'Content-Length': String(body.length)}, body));
        assert.equal(response.status, 200);

        const text = await response.body.text();
        assert.equal(JSON.parse(text).data, body);
    });

    it("supports DELETE", async function () {
        const response = await this.handler.handle(delete_('/delete', {Accept: "application/json"}));
        assert.equal(response.status, 200);

        const json = JSON.parse(await response.body.text());
        assert.equal(json.headers.Accept, "application/json");
    });

    it("supports chunked encoding", async function () {
        const response = await this.handler.handle(get('/stream-bytes/10'));
        assert.equal(response.status, 200);

        for await (const chunk of response.body) {
            assert.equal(chunk.data().byteLength, 10);
        }
    });
}
