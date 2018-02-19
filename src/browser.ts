import {Handler, Request, Response, Headers} from "./http";

export class XmlHttpHandler implements Handler {
    constructor(private readonly handler: XMLHttpRequest = new XMLHttpRequest()) {
    }

    handle(request: Request): Promise<Response> {
        return new Promise<Response>((resolve, reject) => {
                this.handler.open(request.method, request.uri, true);
                this.handler.withCredentials = true;
                this.setHeaders(request.headers);
                this.handler.addEventListener("load", () => {
                    resolve({
                        status: this.handler.status,
                        headers: this.getHeaders(),
                        body: {value: this.handler.responseText}
                    });
                });
                this.handler.addEventListener("error", (e) => reject(e));
                this.handler.send(request.body ? request.body.value : undefined);
            }
        );
    }

    private getHeaders(): Headers {
        return this.handler.getAllResponseHeaders().split("\n").reduce((mutable: { [name: string]: string | string[] }, header) => {
            let [name, value] = header.split(": ");
            let currentValue = mutable[name];
            if (Array.isArray(currentValue)) currentValue.push(value);
            if (typeof currentValue == 'string') mutable[name] = [currentValue, value];
            if (currentValue == null) mutable[name] = value;
            return mutable;
        }, {});
    }

    private setHeaders(headers: Headers) {
        Object.keys(headers).forEach(name => {
            let value = headers[name as keyof Headers];
            if (typeof value == 'undefined') return;
            if (Array.isArray(value)) {
                for (let i = 0; i < value.length; i++) {
                    const v = value[i];
                    this.handler.setRequestHeader(name, v);
                }
            } else {
                this.handler.setRequestHeader(name, value);
            }
        });
    }
}

