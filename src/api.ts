export interface Handler {
    handle(request: Request): Promise<Response>;
}

export interface Closeable<T> {
    close(): Promise<T>
}

export interface Filter {
    filter(handler: Handler): Handler;
}

export interface Message {
    readonly headers: Headers,
    readonly body?: Body
}

if (typeof Symbol.asyncIterator == 'undefined') {
    (Symbol as any).asyncIterator = Symbol.for("Symbol.asyncIterator");
}

export interface Body {
    text(): Promise<string>,

    [Symbol.asyncIterator](): AsyncIterator<Chunk>
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
    readonly uri: string,
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

export function request(method: Method, uri: string, headers?: Headers, body?: string | Body): Request {
    return {method, uri, headers: headers || {}, body: typeof body == 'string' ? new StringBody(body) : body};
}

export function get(uri: string, headers?: Headers): Request {
    return request("GET", uri, headers);
}

export function post(uri: string, headers?: Headers, body?: string | Body): Request {
    return request("POST", uri, headers, body);
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
    // TODO: Parse request.uri and if authority present use that as per RFC
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

export class Uri {
    static RFC_3986: RegExp = /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;
    scheme: string;
    authority: string;
    path: string;
    query: string;
    fragment: string;

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


}