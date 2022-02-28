/// <reference types="node" />
import { Body, Chunk, Handler, Request, Response, Server, Uri } from ".";
import { IncomingMessage, ServerResponse } from 'http';
export declare class ClientHandler implements Handler {
    handle(request: Request): Promise<Response>;
}
export declare const adapter: (handler: Handler) => (nodeRequest: IncomingMessage, nodeResponse: ServerResponse) => void;
export declare class ServerHandler implements Server {
    private handler;
    private server;
    private uri;
    constructor(handler: Handler, { port }?: {
        port?: number | undefined;
    });
    handle(request: Request): Promise<Response>;
    close(): Promise<void>;
    url(): Promise<Uri>;
}
export declare class MessageBody implements Body {
    private message;
    constructor(message: IncomingMessage);
    text(): Promise<string>;
    [Symbol.asyncIterator](): AsyncIterator<Chunk>;
}
