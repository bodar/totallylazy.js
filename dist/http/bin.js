"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ByteBody = exports.ByteChunk = exports.BinHandler = void 0;
const tslib_1 = require("tslib");
const _1 = require(".");
const pattern_1 = require("../pattern");
const sequence_1 = require("../sequence");
const transducers_1 = require("../transducers");
const collections_1 = require("../collections");
class BinHandler {
    handle(request) {
        return (0, pattern_1.match)(request, (0, pattern_1.case_)((0, _1.get)('/get'), this.get.bind(this)), (0, pattern_1.case_)((0, _1.post)('/post'), this.post.bind(this)), (0, pattern_1.case_)((0, _1.put)('/put'), this.put.bind(this)), (0, pattern_1.case_)((0, _1.patch)('/patch'), this.patch.bind(this)), (0, pattern_1.case_)((0, _1.delete_)('/delete'), this.delete_.bind(this)), (0, pattern_1.case_)({ method: 'GET', uri: (0, pattern_1.regex)(/\/stream-bytes\/(\d+)/) }, this.streamBytes), (0, pattern_1.default_)(this.notFound));
    }
    responseBody({ headers, body }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const data = (0, _1.isBody)(body) ? yield body.text() : "";
            return JSON.stringify({ data, headers });
        });
    }
    get(request) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            return (0, _1.ok)();
        });
    }
    post(request) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            return (0, _1.ok)({}, yield this.responseBody(request));
        });
    }
    put(request) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            return (0, _1.ok)({}, yield this.responseBody(request));
        });
    }
    patch(request) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            return (0, _1.ok)({}, yield this.responseBody(request));
        });
    }
    delete_(request) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            return (0, _1.ok)({}, yield this.responseBody(request));
        });
    }
    // @ts-ignore
    streamBytes({ uri: [size] }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            return (0, _1.ok)({}, new ByteBody(randomBytes(size)));
        });
    }
    notFound() {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            return (0, _1.notFound)();
        });
    }
}
exports.BinHandler = BinHandler;
function randomBytes(length) {
    const buffer = (0, collections_1.array)((0, sequence_1.repeat)(Math.random), (0, transducers_1.take)((length / 4) + 1));
    return new Uint8Array(Float32Array.from(buffer).buffer).slice(0, length);
}
class ByteChunk {
    constructor(value) {
        this.value = value;
    }
    text() {
        throw new Error("Unsupported operation error");
    }
    data() {
        return this.value;
    }
}
exports.ByteChunk = ByteChunk;
class ByteBody {
    constructor(value) {
        this.value = value;
    }
    text() {
        throw new Error("Unsupported operation error");
    }
    [Symbol.asyncIterator]() {
        return (0, tslib_1.__asyncGenerator)(this, arguments, function* _a() {
            yield yield (0, tslib_1.__await)(new ByteChunk(this.value));
        });
    }
}
exports.ByteBody = ByteBody;
//# sourceMappingURL=bin.js.map