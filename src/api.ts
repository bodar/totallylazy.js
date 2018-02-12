export interface HttpHandler {
    handle(request: Request): Promise<Response>;
}

export interface Request {
    readonly method: string
    readonly url: URL,
    readonly version?: string,
    readonly headers?: Headers,
}

export interface Response {
    readonly status: Status,
    readonly headers?: Headers,
}

export interface Status {
    readonly code: number,
    readonly description: string
}

export interface Headers {
    readonly [name: string]: string | string[];
}