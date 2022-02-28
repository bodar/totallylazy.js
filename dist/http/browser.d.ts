import { Handler, Request, Response } from ".";
export declare class XmlHttpHandler implements Handler {
    private readonly handler;
    constructor(handler?: XMLHttpRequest);
    handle(request: Request): Promise<Response>;
    private getHeaders;
    private unsafeHeaders;
    private setHeaders;
}
