export interface Handler {
    handle(request: Request): Promise<Response>;
}

export interface Filter {
    filter(handler: Handler): Handler;
}

export interface Message {
    readonly headers: Headers,
    readonly body?: Body
}

if(typeof Symbol.asyncIterator == 'undefined') {
    (Symbol as any).asyncIterator = Symbol.for("Symbol.asyncIterator");
}

export interface Body{
    text():Promise<string>,
    [Symbol.asyncIterator]():AsyncIterator<Chunk>
}

export interface Chunk {
    text():string,
    data():Uint8Array
}

export class StringBody implements Body{
    constructor(private value:string){}

    text(): Promise<string> {
        return Promise.resolve(this.value);
    }

    async *[Symbol.asyncIterator]() {
        yield stringChunk(this.value);
    }
}

export function stringChunk(value:string):Chunk {
    return {
        text: () => value,
        data: () => new TextEncoder().encode(value),
    }
}

export function arrayChunk(value:Uint8Array):Chunk {
    return {
        text: () => new TextDecoder("UTF-8").decode(value),
        data: () => value,
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

export function request(method: Method, uri: string, headers?: Headers, body?: Body): Request {
    return {method, uri, headers: headers || {}, body}
}

export function get(uri: string, headers?: Headers): Request {
    return request("GET", uri, headers);
}

export function post(uri: string, headers?: Headers, body?: Body): Request {
    return request("POST", uri, headers, body);
}

export interface Response extends Message {
    readonly status: number,
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
