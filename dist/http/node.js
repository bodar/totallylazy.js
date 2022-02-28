"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageBody = exports.ServerHandler = exports.adapter = exports.ClientHandler = void 0;
const tslib_1 = require("tslib");
const _1 = require(".");
const http_1 = require("http");
const collections_1 = require("../collections");
class ClientHandler {
    handle(request) {
        return new Promise(resolve => {
            let [hostname, port = 80] = (0, _1.host)(request).split(':');
            let nodeRequest = (0, http_1.request)({
                method: request.method,
                path: request.uri.path,
                hostname: hostname,
                port: port,
                headers: request.headers
            }, (nodeResponse) => {
                resolve({
                    status: nodeResponse.statusCode || -1,
                    headers: nodeResponse.headers,
                    body: new MessageBody(nodeResponse)
                });
            });
            if (request.body) {
                request.body.text().then(value => {
                    nodeRequest.write(value);
                    nodeRequest.end();
                });
            }
            else {
                nodeRequest.end();
            }
        });
    }
}
exports.ClientHandler = ClientHandler;
function headers(rawHeaders) {
    if (rawHeaders.length == 0)
        return {};
    const [name, value, ...remainder] = rawHeaders;
    return Object.assign({ [name]: value }, headers(remainder));
}
const adapter = (handler) => (nodeRequest, nodeResponse) => {
    const req = (0, _1.request)(nodeRequest.method || "", nodeRequest.url || "", headers(nodeRequest.rawHeaders), new MessageBody(nodeRequest));
    (() => (0, tslib_1.__awaiter)(void 0, void 0, void 0, function* () {
        var e_1, _a;
        const response = yield handler.handle(req);
        nodeResponse.statusCode = response.status;
        for (const h in response.headers) {
            const name = h;
            const value = response.headers[name];
            if (value)
                nodeResponse.setHeader(name, value);
        }
        if ((0, _1.isBody)(response.body)) {
            try {
                const text = yield response.body.text();
                nodeResponse.write(text);
            }
            catch (e) {
                try {
                    for (var _b = (0, tslib_1.__asyncValues)(response.body), _c; _c = yield _b.next(), !_c.done;) {
                        const value = _c.value;
                        nodeResponse.write(Buffer.from(value.data().buffer));
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            finally {
                nodeResponse.end();
            }
        }
        else {
            nodeResponse.end();
        }
    }))();
};
exports.adapter = adapter;
class ServerHandler {
    constructor(handler, { port = 0 } = {}) {
        this.handler = handler;
        const server = (0, http_1.createServer)((0, exports.adapter)(this));
        this.server = server;
        this.server.listen(port);
        this.uri = new Promise((resolve) => {
            server.on('listening', () => {
                const address = server.address();
                resolve(new _1.Uri(`http://localhost:${typeof address === 'string' ? port : address.port}/`));
            });
        });
    }
    handle(request) {
        return this.handler.handle(request);
    }
    close() {
        return new Promise(resolve => {
            this.server.close(function () {
                resolve();
            });
        });
    }
    url() {
        return this.uri;
    }
}
exports.ServerHandler = ServerHandler;
class MessageBody {
    constructor(message) {
        this.message = message;
    }
    text() {
        const buffer = [];
        this.message.on("data", chunk => {
            buffer.push(chunk.toString());
        });
        return new Promise((resolve, reject) => {
            this.message.on("end", () => {
                resolve(buffer.join("").toString());
            });
            this.message.on("error", error => {
                reject(error);
            });
        });
    }
    [Symbol.asyncIterator]() {
        const handler = new collections_1.AsyncIteratorHandler();
        this.message.on("data", chunk => handler.value(typeof chunk == 'string' ? stringChunk(chunk) : bufferChunk(chunk)));
        this.message.on("end", () => handler.close());
        this.message.on("error", error => handler.error(error));
        return handler[Symbol.asyncIterator]();
    }
}
exports.MessageBody = MessageBody;
function stringChunk(value) {
    return {
        text: () => value,
        data: () => new TextEncoder().encode(value),
    };
}
function bufferChunk(value) {
    return {
        text: () => value.toString(),
        data: () => value,
    };
}
//# sourceMappingURL=node.js.map