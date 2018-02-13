import {HttpHandler, Request, Response, Headers} from "./api";

export class BrowserHttpHandler implements HttpHandler {
    handle(request: Request): Promise<Response> {
        let handler = new XMLHttpRequest();
        handler.open(request.method, request.url, true);
        handler.withCredentials = true;
        let headers: Headers = request.headers || {};
        Object.keys(headers).forEach(name => {
            let value = headers[name];
            if (Array.isArray(value)) {
                for (let i = 0; i < value.length; i++) {
                    const v = value[i];
                    handler.setRequestHeader(name, v);
                }
            } else {
                handler.setRequestHeader(name, value);
            }
        });
        return new Promise<Response>((resolve, reject) => {
            handler.addEventListener("readystatechange", () => {
                if (handler.readyState == 4) {
                    let headers: Headers = handler.getAllResponseHeaders().split("\n").reduce((a: {}, header) => {
                        let pair = header.split(": ");
                        a[pair[0]] = pair[1];
                        return a;
                    }, {});
                    resolve({status: handler.status, headers: headers, body: {value: handler.responseText}});
                }
            });
            if (request.body) handler.send(request.body.value);
        });
    }
}

