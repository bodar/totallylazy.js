import {Handler, Request, Response, Headers} from "../api";
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
                    const buffer:string[] = [];
                    nodeResponse.on("data", chunk => {
                        buffer.push(chunk.toString());
                    });
                    nodeResponse.on("end", () => {
                        resolve({
                            status: nodeResponse.statusCode || -1,
                            headers: nodeResponse.headers as Headers,
                            body: buffer.join("")
                        });
                    });
                });
                if(request.body) nodeRequest.write(request.body);
                nodeRequest.end();
            }
        );
    }
}