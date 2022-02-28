"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlHttpHandler = void 0;
const tslib_1 = require("tslib");
const _1 = require(".");
class XmlHttpHandler {
    constructor(handler = new XMLHttpRequest()) {
        this.handler = handler;
        this.unsafeHeaders = ['Content-Length', 'Host'];
    }
    handle(request) {
        return new Promise((resolve, reject) => {
            const authority = (0, _1.host)(request);
            let uri = request.uri;
            uri.authority = authority;
            this.handler.open(request.method, uri.toString(), true);
            this.handler.withCredentials = true;
            this.handler.responseType = 'arraybuffer';
            this.setHeaders(request.headers);
            this.handler.addEventListener("load", () => {
                resolve({
                    status: this.handler.status,
                    headers: this.getHeaders(),
                    body: new XMLHttpBody(this.handler)
                });
            });
            this.handler.addEventListener("error", (e) => reject(e));
            if (request.body) {
                request.body.text().then(text => {
                    this.handler.send(text);
                });
            }
            else {
                this.handler.send();
            }
        });
    }
    getHeaders() {
        return this.handler.getAllResponseHeaders().split("\n").reduce((mutable, header) => {
            let [name, value] = header.split(": ");
            let currentValue = mutable[name];
            if (Array.isArray(currentValue))
                currentValue.push(value);
            if (typeof currentValue == 'string')
                mutable[name] = [currentValue, value];
            if (currentValue == null)
                mutable[name] = value;
            return mutable;
        }, {});
    }
    setHeaders(headers) {
        Object.keys(headers).forEach(raw => {
            let name = raw;
            if (this.unsafeHeaders.indexOf(name) != -1)
                return;
            let value = headers[name];
            if (typeof value == 'undefined')
                return;
            if (Array.isArray(value)) {
                for (let i = 0; i < value.length; i++) {
                    const v = value[i];
                    this.handler.setRequestHeader(name, v);
                }
            }
            else {
                this.handler.setRequestHeader(name, value);
            }
        });
    }
}
exports.XmlHttpHandler = XmlHttpHandler;
class XMLHttpBody {
    constructor(value) {
        this.value = value;
    }
    text() {
        return Promise.resolve(this.decode());
    }
    [Symbol.asyncIterator]() {
        return (0, tslib_1.__asyncGenerator)(this, arguments, function* _a() {
            yield yield (0, tslib_1.__await)({
                text: () => this.decode(),
                data: () => this.value.response,
            });
        });
    }
    decode() {
        return new TextDecoder('UTF-8').decode(this.value.response);
    }
}
//# sourceMappingURL=browser.js.map