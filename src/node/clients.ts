import {Handler, Request, Response, Headers, Body, Chunk} from "../api";
import {request as NodeRequest, IncomingMessage} from 'http';
import {TextEncoder} from 'text-encoding';
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
                if (request.body) {
                    request.body.text().then(value => {
                        nodeRequest.write(value);
                        nodeRequest.end();
                    });
                } else {
                    nodeRequest.end();
                }
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
                let foo = buffer.join("").toString();
                resolve(foo)
            });
            this.message.on("error", error => {
                reject(error);
            });
        });
    }

    [Symbol.asyncIterator](): AsyncIterator<Chunk> {
        return new IncomingMessageIterator(this.message);
    }
}

type IteratorState = [Function, Function] | IteratorResult<Chunk> | Error;

class IncomingMessageIterator implements AsyncIterator<Chunk> {
    private state: IteratorState[] = [];

    constructor(private message: IncomingMessage) {
        this.message.on("data", chunk => {
            this.handle({value: typeof chunk == 'string' ? stringChunk(chunk) : bufferChunk(chunk), done: false});
        });
        this.message.on("end", () => {
            this.handle({value: null as any, done: true})
        });
        this.message.on("error", error => {
            this.handle((error))
        });
    }

    handle(state: IteratorState) {
        if (Array.isArray(state)) {
            const head = this.state.pop();
            if (typeof head == 'undefined') {
                this.state.push(state);
            } else {
                const [resolve, reject] = state;
                if (head instanceof Error) reject(head);
                else resolve(head);
            }
        }
        else {
            const head = this.state.pop();
            if (Array.isArray(head)) {
                const [resolve, reject] = head;
                if (state instanceof Error) reject(state);
                else resolve(state);
            } else {
                this.state.push(state);
            }
        }
    }

    next(value?: any): Promise<IteratorResult<Chunk>> {
        const self = this;
        return new Promise<IteratorResult<Chunk>>((resolve, reject) => {
            self.handle([resolve, reject]);
        });
    }

    return(value?: any): Promise<IteratorResult<Chunk>> {
        const self = this;
        return new Promise<IteratorResult<Chunk>>((resolve, reject) => {
            self.handle([resolve, reject]);
        });
    }

    throw(e?: any): Promise<IteratorResult<Chunk>> {
        const self = this;
        return new Promise<IteratorResult<Chunk>>((resolve, reject) => {
            self.handle([resolve, reject]);
        });
    }
}

function stringChunk(value: string): Chunk {
    return {
        text: () => value,
        data: () => new TextEncoder().encode(value),
    }
}

function bufferChunk(value: Buffer): Chunk {
    return {
        text: () => value.toString(),
        data: () => value,
    }
}