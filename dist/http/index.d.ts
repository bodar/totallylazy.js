export interface Handler {
    handle(request: Request): Promise<Response>;
}
export interface Closeable<T> {
    close(): Promise<T>;
}
export interface Server extends Handler, Closeable<void> {
    url(): Promise<Uri>;
}
export interface Filter {
    filter(handler: Handler): Handler;
}
export interface Message {
    readonly headers: Headers;
    readonly body?: Body;
}
export interface Body {
    text(): Promise<string>;
    [Symbol.asyncIterator](): AsyncIterator<Chunk>;
}
export declare function isBody(instance: any): instance is Body;
export interface Chunk {
    text(): string;
    data(): Uint8Array;
}
export declare class StringBody implements Body {
    private value;
    constructor(value: string);
    text(): Promise<string>;
    [Symbol.asyncIterator](): AsyncGenerator<Chunk, void, unknown>;
}
export declare function stringChunk(value: string): Chunk;
export interface Request extends Message {
    readonly method: Method;
    readonly uri: Uri;
    readonly version?: string;
}
export declare type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE' | 'CONNECT' | 'UPGRADE' | string;
export declare function request(method: Method, uri: Uri | string, headers?: Headers, body?: string | Body): Request;
export declare function get(uri: Uri | string, headers?: Headers): Request;
export declare function post(uri: Uri | string, headers?: Headers, body?: string | Body): Request;
export declare function put(uri: Uri | string, headers?: Headers, body?: string | Body): Request;
export declare function patch(uri: Uri | string, headers?: Headers, body?: string | Body): Request;
export declare function delete_(uri: Uri | string, headers?: Headers): Request;
export interface Response extends Message {
    readonly status: number;
}
export declare function response(status: number, headers?: Headers, body?: string | Body): Response;
export declare function ok(headers?: Headers, body?: string | Body): Response;
export declare function notFound(headers?: Headers, body?: string | Body): Response;
export declare type Headers = {
    readonly [h in Header]?: string | string[];
};
export declare type Header = 'Accept' | 'Accept-Charset' | 'Accept-Encoding' | 'Accept-Language' | 'Authorization' | 'Cache-Control' | 'Content-Encoding' | 'Content-Language' | 'Content-Length' | 'Content-Location' | 'Content-Type' | 'Content-MD5' | 'Date' | 'ETag' | 'Expires' | 'Host' | 'If-Match' | 'If-Modified-Since' | 'If-None-Match' | 'If-Unmodified-Since' | 'Last-Modified' | 'Location' | 'User-Agent' | 'Vary' | 'WWW-Authenticate' | 'Cookie' | 'Set-Cookie' | 'X-Forwarded-For' | 'X-Forwarded-Proto' | 'X-Forwarded-Host' | 'X-Frame-Options' | 'X-CorrelationID' | 'Transfer-Encoding' | 'Access-Control-Allow-Origin';
export declare function modify<T, K extends keyof T>(instance: T, key: K, handler: (value: T[K]) => T[K]): T;
export declare function const_<T>(value: T): () => T;
export declare function replace<T, K extends keyof T>(key: K, value: T[K]): (instance: T) => T;
export declare function host(request: Request): string;
export declare class HostHandler implements Handler {
    private handler;
    private host;
    constructor(handler: Handler, host: string);
    handle(request: Request): Promise<Response>;
}
/**
 * Uri class based on {@link https://tools.ietf.org/html/rfc3986 RFC 3986}
 */
export declare class Uri {
    /** {@link https://tools.ietf.org/html/rfc3986#appendix-B } */
    static RFC_3986: RegExp;
    scheme?: string;
    authority?: string;
    path: string;
    query?: string;
    fragment?: string;
    constructor(value: string);
    /** {@link https://tools.ietf.org/html/rfc3986#section-5.3} */
    toString(): string;
    toJSON(): string;
}
