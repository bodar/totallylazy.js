import {HttpHandler, Request, Response} from "./api";

export class BrowserHttpHandler implements HttpHandler {
    handle(request: Request): Promise<Response> {
        return new Promise<Response>(() => {

        });
    }
}

