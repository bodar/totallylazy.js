import {Closeable, Handler, Header, Headers, request, Request, Response} from "../api";
import {createServer, Server, IncomingMessage, ServerResponse} from 'http';

export class NodeServerHandler implements Handler, Closeable<void> {
    private server: Server;

    constructor(private handler: Handler, {port = 8080} = {}) {
        this.server = createServer((nodeRequest: IncomingMessage, nodeResponse: ServerResponse) => {
            let req = request(nodeRequest.method || "", nodeRequest.url || "", nodeRequest.headers as Headers);
            this.handle(req).then(response => {
                nodeResponse.statusCode = response.status;
                for (let h in response.headers) {
                    const name = h as Header;
                    const value = response.headers[name];
                    if (value) nodeResponse.setHeader(name, value);
                }
                nodeResponse.flushHeaders();
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