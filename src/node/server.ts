import {Chunk, Closeable, Handler, Header, Headers, request, Request, Response} from "../api";
import {createServer, Server, IncomingMessage, ServerResponse} from 'http';
import {MessageBody} from "./clients";

export class NodeServerHandler implements Handler, Closeable<void> {
    private server: Server;

    constructor(private handler: Handler, {port = 8080} = {}) {
        this.server = createServer((nodeRequest: IncomingMessage, nodeResponse: ServerResponse) => {
            let req = request(nodeRequest.method || "",
                nodeRequest.url || "",
                nodeRequest.headers as Headers,
                new MessageBody(nodeRequest));
            this.handle(req).then(response => {
                nodeResponse.statusCode = response.status;
                for (let h in response.headers) {
                    const name = h as Header;
                    const value = response.headers[name];
                    if (value) nodeResponse.setHeader(name, value);
                }
                if (response.body) {
                    try {
                        response.body.text().then(response => {
                            nodeResponse.write(response);
                            nodeResponse.end();
                        })
                    } catch (e) {
                        step(nodeResponse, response.body[Symbol.asyncIterator]());
                    }
                } else {
                    nodeResponse.end();
                }
            });
        });
        this.server.listen(port);
    }

    handle(request: Request): Promise<Response> {
        return this.handler.handle(request);
    }

    close(): Promise<void> {
        return new Promise<void>(resolve => {
            this.server.close(function () {
                resolve();
            });
        });
    }
}

function step(nodeResponse: ServerResponse, iterator: AsyncIterator<Chunk>) {
    let next = iterator.next();
    next.then(result => {
        if (result.value) {
            nodeResponse.write(Buffer.from(result.value.data().buffer as any));
        }
        if (result.done) {
            nodeResponse.end();
        } else {
            step(nodeResponse, iterator);
        }
    });
}
