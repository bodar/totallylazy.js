import {Handler, Request, Response, Headers} from "../api";
import {request, IncomingMessage} from 'http';
import {URL} from 'url';

export class NodeClientHandler implements Handler {
    handle(req: Request): Promise<Response> {
        return new Promise<Response>((resolve, reject) => {
                const url = new URL(req.uri);
                request({method: req.method, path: url.pathname, hostname: url.host}, (res: IncomingMessage) => {
                    resolve({status: res.statusCode || -1, headers: res.headers as Headers});
                })
            }
        );
    }
}

