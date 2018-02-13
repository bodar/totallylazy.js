export interface HttpHandler {
    handle(request: Request): Promise<Response>;
}

export interface Message {
    readonly headers?: Headers,
    readonly body?: Body
}

export interface Request extends Message {
    readonly method: string
    readonly url: URL,
    readonly version?: string,
}

export interface Response extends Message {
    readonly status: number,
}

export interface Headers {
    readonly [name: string]: string | string[];
}

export interface Body {

}