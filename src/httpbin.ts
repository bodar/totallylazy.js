import {Body, Handler, notFound, ok, Request, Response} from "./api";
import {match, case_, default_, Matched} from "./pattern";

export class HttpBinHandler implements Handler {
    handle(request: Request): Promise<Response> {
        return match(request,
            case_({uri: '/get'}, this.get),
            case_({uri: '/post'}, this.post),
            default_(this.notFound));
    }

    get(request: Matched<Request>): Promise<Response> {
        return Promise.resolve(ok());
    }

    post(request: Matched<Request>): Promise<Response> {
        return request.body ? (request.body as Body).text().then(data => {
            return ok({}, JSON.stringify({data}));
        }) : Promise.resolve(ok());
    }

    notFound() {
        return Promise.resolve(notFound());
    }
}
