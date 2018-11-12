if (typeof Symbol.asyncIterator == 'undefined') {
    (Symbol as any).asyncIterator = Symbol.for("Symbol.asyncIterator");
}

export interface Handler {
    handle(request: Request): Promise<Response>;
}

export interface Closeable<T> {
    close(): Promise<T>
}

export interface Server extends Handler, Closeable<void>{
    url(): Promise<Uri>
}

export interface Filter {
    filter(handler: Handler): Handler;
}

export interface Message {
    readonly headers: Headers,
    readonly body?: Body
}

export interface Body {
    text(): Promise<string>,

    [Symbol.asyncIterator](): AsyncIterator<Chunk>
}

export function isBody(instance: any): instance is Body {
    return typeof instance == 'object' && 'text' in instance && Symbol.asyncIterator in instance;
}

export interface Chunk {
    text(): string,

    data(): Uint8Array
}

export class StringBody implements Body {
    constructor(private value: string) {
    }

    text(): Promise<string> {
        return Promise.resolve(this.value);
    }

    async * [Symbol.asyncIterator]() {
        yield stringChunk(this.value);
    }
}

export function stringChunk(value: string): Chunk {
    return {
        text: () => value,
        data: () => new TextEncoder().encode(value),
    }
}

export interface Request extends Message {
    readonly method: Method
    readonly uri: Uri,
    readonly version?: string,
}

export type Method =
    'GET'
    | 'POST'
    | 'PUT'
    | 'PATCH'
    | 'DELETE'
    | 'HEAD'
    | 'OPTIONS'
    | 'TRACE'
    | 'CONNECT'
    | 'UPGRADE'
    | string;

export function request(method: Method, uri: Uri | string, headers?: Headers, body?: string | Body): Request {
    return {
        method,
        uri: typeof uri == 'string' ? new Uri(uri) : uri,
        headers: headers || {},
        body: typeof body == 'string' ? new StringBody(body) : body
    };
}

export function get(uri: Uri | string, headers?: Headers): Request {
    return request("GET", uri, headers);
}

export function post(uri: Uri | string, headers?: Headers, body?: string | Body): Request {
    return request("POST", uri, headers, body);
}

export function put(uri: Uri | string, headers?: Headers, body?: string | Body): Request {
    return request("PUT", uri, headers, body);
}

export function patch(uri: Uri | string, headers?: Headers, body?: string | Body): Request {
    return request("PATCH", uri, headers, body);
}

export function delete_(uri: Uri | string, headers?: Headers): Request {
    return request("DELETE", uri, headers);
}

export interface Response extends Message {
    readonly status: number,
}

export function response(status: number, headers?: Headers, body?: string | Body): Response {
    return {status, headers: headers || {}, body: typeof body == 'string' ? new StringBody(body) : body}
}

export function ok(headers?: Headers, body?: string | Body): Response {
    return response(200, headers, body);
}

export function notFound(headers?: Headers, body?: string | Body): Response {
    return response(404, headers, body);
}

export type Headers = { readonly [h in Header]?: string | string[] }

export type Header =
    'Accept'
    | 'Accept-Charset'
    | 'Accept-Encoding'
    | 'Accept-Language'
    | 'Authorization'
    | 'Cache-Control'
    | 'Content-Encoding'
    | 'Content-Language'
    | 'Content-Length'
    | 'Content-Location'
    | 'Content-Type'
    | 'Content-MD5'
    | 'Date'
    | 'ETag'
    | 'Expires'
    | 'Host'
    | 'If-Match'
    | 'If-Modified-Since'
    | 'If-None-Match'
    | 'If-Unmodified-Since'
    | 'Last-Modified'
    | 'Location'
    | 'User-Agent'
    | 'Vary'
    | 'WWW-Authenticate'
    | 'Cookie'
    | 'Set-Cookie'
    | 'X-Forwarded-For'
    | 'X-Forwarded-Proto'
    | 'X-Forwarded-Host'
    | 'X-Frame-Options'
    | 'X-CorrelationID'
    | 'Transfer-Encoding'
    | 'Access-Control-Allow-Origin';

export function modify<T, K extends keyof T>(instance: T, key: K, handler: (value: T[K]) => T[K]): T {
    return Object.assign({}, instance, {[key]: handler(instance[key])});
}

export function const_<T>(value: T): () => T {
    return () => value;
}

export function replace<T, K extends keyof T>(key: K, value: T[K]): (instance: T) => T {
    return instance => modify(instance, key, const_(value));
}

export function host(request: Request): string {
    if (typeof request.uri.authority != 'undefined') return request.uri.authority;
    let value = request.headers.Host;
    if (typeof value != 'string') throw new Error("Bad Request");
    return value;
}

export class HostHandler implements Handler {
    constructor(private handler: Handler, private host: string) {
    }

    handle(request: Request): Promise<Response> {
        return this.handler.handle(modify(request, 'headers', replace('Host', this.host)));
    }
}

/**
 * Uri class based on {@link https://tools.ietf.org/html/rfc3986 RFC 3986}
 */
export class Uri {
    /** {@link https://tools.ietf.org/html/rfc3986#appendix-B } */
    static RFC_3986 = /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;
    scheme: string | undefined;
    authority: string | undefined;
    path: string;
    query: string | undefined;
    fragment: string | undefined;

    constructor(value: string) {
        const match = Uri.RFC_3986.exec(value);
        if (!match) throw new Error(`Invalid Uri: ${value}`);
        const [, , scheme, , authority, path, , query, , fragment] = match;
        this.scheme = scheme;
        this.authority = authority;
        this.path = path;
        this.query = query;
        this.fragment = fragment;
    }

    /** {@link https://tools.ietf.org/html/rfc3986#section-5.3} */
    toString() {
        const result: string[] = [];

        if (typeof this.scheme != 'undefined') result.push(this.scheme, ":");
        if (typeof this.authority != 'undefined') result.push("//", this.authority);
        result.push(this.path);
        if (typeof this.query != 'undefined') result.push("?", this.query);
        if (typeof this.fragment != 'undefined') result.push("#", this.fragment);
        return result.join('');
    }
}