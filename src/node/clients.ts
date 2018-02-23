import {Handler, Request, Response, Headers, Body, Chunk, arrayChunk, stringChunk} from "../api";
import {request as NodeRequest, IncomingMessage} from 'http';
import {URL} from 'url';

export class NodeClientHandler implements Handler {
    handle(request: Request): Promise<Response> {
        return new Promise<Response>((resolve, reject) => {
                const url = new URL(request.uri);
                let nodeRequest = NodeRequest({
                    method: request.method,
                    path: url.pathname,
                    hostname: url.host,
                    headers: request.headers
                }, (nodeResponse: IncomingMessage) => {
                    resolve({
                        status: nodeResponse.statusCode || -1,
                        headers: nodeResponse.headers as Headers,
                        body: new MessageBody(nodeResponse)
                    });
                });
                if (request.body) request.body.text().then(value => nodeRequest.write(value));
                nodeRequest.end();
            }
        );
    }
}

class MessageBody implements Body {
    constructor(private message: IncomingMessage) {
    }

    text(): Promise<string> {
        const buffer: string[] = [];

        this.message.on("data", chunk => {
            buffer.push(chunk.toString());
        });

        return new Promise<string>((resolve, reject) => {
            this.message.on("end", () => {
                resolve(buffer.join(""))
            });
            this.message.on("error", error => {
                reject(error);
            });
        });
    }

    [Symbol.asyncIterator](): AsyncIterator<Chunk> {
        const m = this.message;
        return {
            next(value?: any): Promise<IteratorResult<Chunk>> {
                return new Promise<IteratorResult<Chunk>>((resolve, reject) => {
                    m.on("data", chunk => {
                        resolve({value: typeof chunk == 'string' ? stringChunk(chunk) : arrayChunk(chunk), done: false});
                    });
                    m.on("end", () => {
                        resolve({value: null as any, done: true});
                    });
                    m.on("error", error => {
                        reject(error);
                    });
                })
            }
        };
    }
}