export interface HttpHandler {
    handle(request: Request): Promise<Response>;
}

export interface Message {
    readonly headers?: Headers,
    readonly body?: Body
}

export interface Request extends Message {
    readonly method: 'GET' | 'POST' | string
    readonly url: string,
    readonly version?: string,
}

export interface Uri {
    readonly scheme:string,
    readonly authority:string,
}

export interface Response extends Message {
    readonly status: number,
}

export interface Headers {
    readonly [name: string]: string | string[];
}

export interface Body {
    readonly value: string;
}