import {HttpHandler, Request, Response} from "./api";

export class ClientHttpHandler implements HttpHandler {
    handle(request: Request): Promise<Response> {
        return new Promise<Response>(() => {

        });
    }
}

export class HelloWorld implements HttpHandler {
    handle({method, url}: Request): Promise<Response> {
        return new Promise<Response>(() => {
            switch(method){
                case 'GET': return Response
            }
        });
    }

}