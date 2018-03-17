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

            (async () => {
                const response = await this.handle(req);
                nodeResponse.statusCode = response.status;
                for (let h in response.headers) {
                    const name = h as Header;
                    const value = response.headers[name];
                    if (value) nodeResponse.setHeader(name, value);
                }
                if (response.body) {
                    try {
                        const text = await response.body.text();
                        nodeResponse.write(text);
                    } catch (e) {
                        for await(const value of response.body) {
                            nodeResponse.write(Buffer.from(value.data().buffer as any));
                        }
                    } finally {
                        nodeResponse.end();
                    }
                } else {
                    nodeResponse.end();
                }
            })();
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

