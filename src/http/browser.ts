import {Handler, Request, Response, Headers, Header, Body, host} from ".";

export class XmlHttpHandler implements Handler {
    constructor(private readonly handler: XMLHttpRequest = new XMLHttpRequest()) {
    }

    handle(request: Request): Promise<Response> {
        return new Promise<Response>((resolve, reject) => {
                const authority = host(request);
                let uri = request.uri;
                uri.authority = authority;
                this.handler.open(request.method, uri.toString(), true);
                this.handler.withCredentials = true;
                this.handler.responseType = 'arraybuffer';
                this.setHeaders(request.headers);
                this.handler.addEventListener("load", () => {
                    resolve({
                        status: this.handler.status,
                        headers: this.getHeaders(),
                        body: new XMLHttpBody(this.handler)
                    });
                });
                this.handler.addEventListener("error", (e) => reject(e));
                if (request.body) {
                    request.body.text().then(text => {
                        this.handler.send(text);
                    })
                } else {
                    this.handler.send();
                }
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

    private unsafeHeaders: Header[] = ['Content-Length', 'Host'];

    private setHeaders(headers: Headers) {
        Object.keys(headers).forEach(raw => {
            let name = raw as keyof Headers;
            if (this.unsafeHeaders.indexOf(name) != -1) return;
            let value = headers[name];
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

class XMLHttpBody implements Body {
    constructor(private value: XMLHttpRequest) {
    }

    text(): Promise<string> {
        return Promise.resolve(this.decode());
    }

    async * [Symbol.asyncIterator]() {
        yield {
            text: () => this.decode(),
            data: () => this.value.response,
        }
    }

    private decode(): string {
        return new TextDecoder('UTF-8').decode(this.value.response);
    }
}

