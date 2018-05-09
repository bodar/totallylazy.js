import {Server, Handler, Header, Headers, isBody, request, Request, Response, Uri} from "../index";
import {createServer, IncomingMessage, ServerResponse, Server as NodeServer} from 'http';
import {MessageBody} from "./clients";

export class NodeServerHandler implements Server {
    private server: NodeServer;
    private uri: Promise<Uri>;

    constructor(private handler: Handler, {port = 0} = {}) {
        const server = createServer((nodeRequest: IncomingMessage, nodeResponse: ServerResponse) => {
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
                if(isBody(response.body)){
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
        this.server = server;
        this.server.listen(port);
        this.uri = new Promise<Uri>((resolve) => {
            server.on('listening', () => {
                resolve(new Uri(`http://localhost:${server.address().port}/`))
            })
        })
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

    url(): Promise<Uri> {
        return this.uri;
    }
}

