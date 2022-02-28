import { Body, Chunk, Handler, Request, Response } from ".";
import { Matched } from "../pattern";
export declare class BinHandler implements Handler {
    handle(request: Request): Promise<Response>;
    responseBody({ headers, body }: Matched<Request>): Promise<string>;
    get(request: Matched<Request>): Promise<Response>;
    post(request: Matched<Request>): Promise<Response>;
    put(request: Matched<Request>): Promise<Response>;
    patch(request: Matched<Request>): Promise<Response>;
    delete_(request: Matched<Request>): Promise<Response>;
    streamBytes({ uri: [size] }: Matched<Request>): Promise<Response>;
    notFound(): Promise<Response>;
}
export declare class ByteChunk implements Chunk {
    private value;
    constructor(value: Uint8Array);
    text(): string;
    data(): Uint8Array;
}
export declare class ByteBody implements Body {
    private value;
    constructor(value: Uint8Array);
    text(): Promise<string>;
    [Symbol.asyncIterator](): AsyncIterator<Chunk>;
}
