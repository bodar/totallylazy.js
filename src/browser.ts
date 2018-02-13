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
                    let headers: Headers = handler.getAllResponseHeaders().split("\n").reduce((mutable: {[name: string]: string | string[]}, header) => {
                        let [name, value] = header.split(": ");
                        let currentValue = mutable[name];
                        if(Array.isArray(currentValue)) currentValue.push(value);
                        if(typeof currentValue == 'string') mutable[name] = [currentValue, value];
                        if(currentValue == null) mutable[name] = value;
                        return mutable;
                    }, {});
                    resolve({status: handler.status, headers: headers, body: {value: handler.responseText}});
                }
            });
            if (request.body) handler.send(request.body.value);
        });
    }
}

