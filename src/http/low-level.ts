import {Body, Headers, isBody, Method, Request, Response, Uri} from "./index";
import {reduce} from "../transducers";
import {single} from "../collections";

export type Trailers = Headers;

export interface RequestStart {
    readonly method: Method
    readonly uri: Uri,
    readonly version?: string,
}

export interface ResponseStart {
    readonly status: number,
    readonly statusDescription?: string,
}

export type LowLevelRequest = AsyncGenerator<RequestStart | Headers | Body | Trailers, void>
export type LowLevelResponse = AsyncGenerator<ResponseStart | Headers | Body | Trailers, void>

export type LowLevelHandler = (request: LowLevelRequest) => LowLevelResponse;

export function message(start: RequestStart, headers?: Headers, body?: Body, trailers?: Headers): LowLevelRequest;
export function message(start: ResponseStart, headers?: Headers, body?: Body, trailers?: Headers): LowLevelResponse;
export async function* message(start: RequestStart | ResponseStart, headers?: Headers, body?: Body, trailers?: Headers): any {
    yield start;
    if (headers) yield headers;
    if (body) yield body;
    if (trailers) yield trailers;
}

export function get(uri: string, headers?: Headers, body?: Body, trailers?: Headers): LowLevelRequest {
    return message({method: "GET", uri: new Uri(uri)}, headers, body, trailers);
}

export function ok(headers?: Headers, body?: Body, trailers?: Headers): LowLevelResponse {
    return message({status: 200, statusDescription: 'OK'}, headers, body, trailers);
}

export function notFound(headers?: Headers, body?: Body, trailers?: Headers): LowLevelResponse {
    return message({status: 404, statusDescription: 'Not Found'}, headers, body, trailers);
}

export function isRequestStart(value: any): value is RequestStart {
    return value && typeof value.method === "string" &&
        value.uri instanceof Uri &&
        typeof value.version === "string" || typeof value.version === "undefined";
}

export function isResponseStart(value: any): value is ResponseStart {
    return value && typeof value.status === "number" &&
        typeof value.statusDescription === "string" || typeof value.statusDescription === "undefined";
}

export function isHeaders(value: any): value is Headers {
    return value && typeof value === "object" &&
        Object.values(value).every(v => typeof v === "string");
}

export async function request(source: LowLevelRequest): Promise<Request> {
    // TODO: enforce order (combinators to the rescue?)
    return single(source, reduce((a, block) => {
        if (isRequestStart(block)) return {...a, ...block};
        if (isBody(block)) return {...a, body: block};
        // TODO: High Level API needs to support Trailers
        if (isHeaders(block)) return {...a, headers: block};
        return a;
    }, {} as Request));
}

export async function response(source: LowLevelResponse): Promise<Response> {
    // TODO: enforce order (combinators to the rescue?)
    return single(source, reduce((a, block) => {
        if (isResponseStart(block)) return {...a, ...block};
        if (isBody(block)) return {...a, body: block};
        // TODO: High Level API needs to support Trailers
        if (isHeaders(block)) return {...a, headers: block};
        return a;
    }, {} as Response));
}

export async function consumeRequestStart(source: LowLevelRequest): Promise<RequestStart> {
    const {done, value} = await source.next();
    if (done) throw new Error('Request has already consumed');
    if (!isRequestStart(value)) throw new Error(`Expected RequestStart but got: ${value}`);
    return value;
}

export async function consumeHeaders(source: LowLevelRequest): Promise<Headers> {
    const {done, value} = await source.next();
    if (done) throw new Error('Request has already consumed');
    if (!isHeaders(value)) throw new Error(`Expected Headers but got: ${value}`);
    return value;
}