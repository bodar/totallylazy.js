import {Body, Chunk, delete_, get, Handler, isBody, notFound, ok, patch, post, put, Request, Response} from ".";
import {match, case_, default_, Matched, regex} from "../pattern";
import {repeat, sequence} from "../sequence";
import {take} from "../transducers";
import {array} from "../collections";

export class BinHandler implements Handler {
    handle(request: Request): Promise<Response> {
        return match(request,
            case_(get('/get'), this.get.bind(this)),
            case_(post('/post'), this.post.bind(this)),
            case_(put('/put'), this.put.bind(this)),
            case_(patch('/patch'), this.patch.bind(this)),
            case_(delete_('/delete'), this.delete_.bind(this)),
            case_({method: 'GET', uri: regex(/\/stream-bytes\/(\d+)/)}, this.streamBytes),
            default_(this.notFound));
    }

    async responseBody({headers, body}: Matched<Request>): Promise<string> {
        const data = isBody(body) ? await body.text() : "";
        return JSON.stringify({data, headers});
    }

    async get(request: Matched<Request>) {
        return ok();
    }

    async post(request: Matched<Request>) {
        return ok({}, await this.responseBody(request));
    }

    async put(request: Matched<Request>) {
        return ok({}, await this.responseBody(request));
    }

    async patch(request: Matched<Request>) {
        return ok({}, await this.responseBody(request));
    }

    async delete_(request: Matched<Request>) {
        return ok({}, await this.responseBody(request));
    }

    async streamBytes({uri: [size]}: Matched<Request>) {
        return ok({}, new ByteBody(randomBytes(size)));
    }

    async notFound() {
        return notFound();
    }
}


function randomBytes(length: number) {
    const buffer = array(sequence(repeat(Math.random), take((length / 4) + 1)));

    return new Uint8Array(Float32Array.from(buffer).buffer).slice(0, length);
}

export class ByteChunk implements Chunk {
    constructor(private value: Uint8Array) {
    }

    text(): string {
        throw new Error("Unsupported operation error");
    }

    data(): Uint8Array {
        return this.value;
    }
}

export class ByteBody implements Body {
    constructor(private value: Uint8Array) {
    }

    text(): Promise<string> {
        throw new Error("Unsupported operation error");
    }

    async* [Symbol.asyncIterator](): AsyncIterator<Chunk> {
        yield new ByteChunk(this.value);
    }
}
