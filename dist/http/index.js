"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Uri = exports.HostHandler = exports.host = exports.replace = exports.const_ = exports.modify = exports.notFound = exports.ok = exports.response = exports.delete_ = exports.patch = exports.put = exports.post = exports.get = exports.request = exports.stringChunk = exports.StringBody = exports.isBody = void 0;
const tslib_1 = require("tslib");
if (typeof Symbol.asyncIterator == 'undefined') {
    Symbol.asyncIterator = Symbol.for("Symbol.asyncIterator");
}
function isBody(instance) {
    return typeof instance == 'object' && 'text' in instance && Symbol.asyncIterator in instance;
}
exports.isBody = isBody;
class StringBody {
    constructor(value) {
        this.value = value;
    }
    text() {
        return Promise.resolve(this.value);
    }
    [Symbol.asyncIterator]() {
        return (0, tslib_1.__asyncGenerator)(this, arguments, function* _a() {
            yield yield (0, tslib_1.__await)(stringChunk(this.value));
        });
    }
}
exports.StringBody = StringBody;
function stringChunk(value) {
    return {
        text: () => value,
        data: () => new TextEncoder().encode(value),
    };
}
exports.stringChunk = stringChunk;
function request(method, uri, headers, body) {
    return {
        method,
        uri: typeof uri == 'string' ? new Uri(uri) : uri,
        headers: headers || {},
        body: typeof body == 'string' ? new StringBody(body) : body
    };
}
exports.request = request;
function get(uri, headers) {
    return request("GET", uri, headers);
}
exports.get = get;
function post(uri, headers, body) {
    return request("POST", uri, headers, body);
}
exports.post = post;
function put(uri, headers, body) {
    return request("PUT", uri, headers, body);
}
exports.put = put;
function patch(uri, headers, body) {
    return request("PATCH", uri, headers, body);
}
exports.patch = patch;
function delete_(uri, headers) {
    return request("DELETE", uri, headers);
}
exports.delete_ = delete_;
function response(status, headers, body) {
    return { status, headers: headers || {}, body: typeof body == 'string' ? new StringBody(body) : body };
}
exports.response = response;
function ok(headers, body) {
    return response(200, headers, body);
}
exports.ok = ok;
function notFound(headers, body) {
    return response(404, headers, body);
}
exports.notFound = notFound;
function modify(instance, key, handler) {
    return Object.assign({}, instance, { [key]: handler(instance[key]) });
}
exports.modify = modify;
function const_(value) {
    return () => value;
}
exports.const_ = const_;
function replace(key, value) {
    return instance => modify(instance, key, const_(value));
}
exports.replace = replace;
function host(request) {
    if (typeof request.uri.authority != 'undefined')
        return request.uri.authority;
    let value = request.headers.Host;
    if (typeof value != 'string')
        throw new Error("Bad Request");
    return value;
}
exports.host = host;
class HostHandler {
    constructor(handler, host) {
        this.handler = handler;
        this.host = host;
    }
    handle(request) {
        return this.handler.handle(modify(request, 'headers', replace('Host', this.host)));
    }
}
exports.HostHandler = HostHandler;
/**
 * Uri class based on {@link https://tools.ietf.org/html/rfc3986 RFC 3986}
 */
class Uri {
    constructor(value) {
        const match = Uri.RFC_3986.exec(value);
        if (!match)
            throw new Error(`Invalid Uri: ${value}`);
        const [, , scheme, , authority, path, , query, , fragment] = match;
        this.scheme = scheme;
        this.authority = authority;
        this.path = path;
        this.query = query;
        this.fragment = fragment;
    }
    /** {@link https://tools.ietf.org/html/rfc3986#section-5.3} */
    toString() {
        const result = [];
        if (typeof this.scheme != 'undefined')
            result.push(this.scheme, ":");
        if (typeof this.authority != 'undefined')
            result.push("//", this.authority);
        result.push(this.path);
        if (typeof this.query != 'undefined')
            result.push("?", this.query);
        if (typeof this.fragment != 'undefined')
            result.push("#", this.fragment);
        return result.join('');
    }
    toJSON() {
        return this.toString();
    }
}
exports.Uri = Uri;
/** {@link https://tools.ietf.org/html/rfc3986#appendix-B } */
Uri.RFC_3986 = /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;
//# sourceMappingURL=index.js.map