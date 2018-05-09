import {host, Handler, Request, Response, Headers, Body, Chunk} from "../api";
import {request as NodeRequest, IncomingMessage} from 'http';
import {TextEncoder} from 'text-encoding';
import {URL} from 'url';

export class NodeClientHandler implements Handler {
    handle(request: Request): Promise<Response> {
        return new Promise<Response>(resolve => {
                let [hostname, port = 80] = host(request).split(':');
                let nodeRequest = NodeRequest({
                    method: request.method,
                    path: request.uri.path,
                    hostname: hostname,
                    port: port,
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

export class MessageBody implements Body {
    constructor(private message: IncomingMessage) {
    }

    text(): Promise<string> {
        const buffer: string[] = [];

        this.message.on("data", chunk => {
            buffer.push(chunk.toString());
        });

        return new Promise<string>((resolve, reject) => {
            this.message.on("end", () => {
                resolve(buffer.join("").toString())
            });
            this.message.on("error", error => {
                reject(error);
            });
        });
    }

    [Symbol.asyncIterator](): AsyncIterator<Chunk> {
        const iterator = new AsyncIteratorHandler<Chunk>();
        this.message.on("data", chunk => {
            iterator.handle({value: typeof chunk == 'string' ? stringChunk(chunk) : bufferChunk(chunk), done: false});
        });
        this.message.on("end", () => {
            iterator.handle({value: null as any, done: true})
        });
        this.message.on("error", error => {
            iterator.handle(error)
        });
        return iterator;
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

type StateHandler = [Function, Function];
type IteratorState<T> = StateHandler | IteratorResult<T> | Error;

function isStateHandler<T>(state: IteratorState<T>): state is StateHandler {
    return Array.isArray(state);
}

function consume<T>(state: IteratorResult<T> | Error, [resolve, reject]: [Function, Function]) {
    if (state instanceof Error) reject(state);
    else resolve(state);
}

class AsyncIteratorHandler<T> implements AsyncIterator<T> {
    private state: IteratorState<T>[] = [];

    handle(newState: IteratorState<T>) {
        const nextState = this.state.pop();
        if (typeof nextState == 'undefined') return this.state.push(newState);
        if (isStateHandler(newState) && !isStateHandler(nextState)) return consume(nextState, newState);
        if (!isStateHandler(newState) && isStateHandler(nextState)) return consume(newState, nextState);
        this.state.unshift(nextState);
        this.state.push(newState);
    }

    next(): Promise<IteratorResult<T>> {
        return new Promise<IteratorResult<T>>((resolve, reject) => {
            this.handle([resolve, reject]);
        });
    }
}

