import {Body, Chunk, get, Handler, notFound, ok, post, Request, Response} from "./api";
import {match, case_, default_, Matched, regex} from "./totallylazy/pattern";

export class HttpBinHandler implements Handler {
    handle(request: Request): Promise<Response> {
        return match(request,
            case_(get('/get'), this.get),
            case_(post('/post'), this.post),
            case_({method: 'GET', uri: regex(/\/stream-bytes\/(\d+)/)}, this.streamBytes),
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

    streamBytes({uri:[,size]}: Matched<Request>): Promise<Response> {
        return Promise.resolve(ok({}, new ByteBody(randomBytes(size))));
    }

    notFound() {
        return Promise.resolve(notFound());
    }
}


function randomBytes(length: number) {
    const sizeInFloats = length / 4;
    const buffer: number[] = [];
    for (let i = 0; i < sizeInFloats; i++) {
        buffer[i] = Math.random();
    }

    return new Uint8Array(Float32Array.from(buffer).buffer).slice(0, length);
}

class ByteChunk  implements Chunk{
    constructor(private value:Uint8Array){}

    text(): string {
        throw new Error("Unsupported operation error");
    }

    data(): Uint8Array {
        return this.value;
    }
}

class ByteBody implements Body{
    constructor(private value:Uint8Array){}

    text(): Promise<string> {
        throw new Error("Unsupported operation error");
    }

    async * [Symbol.asyncIterator](): AsyncIterator<Chunk> {
        yield new ByteChunk(this.value);
    }
}
