import {expect} from 'chai';
import {
    consumeHeaders, consumeRequestStart,
    get,
    LowLevelHandler,
    notFound,
    ok,
    request,
    response
} from "../../src/http/low-level";
import {StringBody} from "../../src/http";

describe('Low Level API', function () {
    describe("via high level API", () => {
        it('can convert response', async () => {
            const http: LowLevelHandler = request => ok();

            const res = await response(http(get('/')));

            expect(res.status).to.eql(200);
        });

        it('can route via request', async () => {
            const http: LowLevelHandler = async function* (raw) {
                const {uri: {path}} = await request(raw);
                if (path === "/path") yield* ok();
                else yield* notFound();
            };

            const res = await response(http(get('/path')));

            expect(res.status).to.eql(200);
        });
    });

    describe("low level routing", () => {
        it('can route via RequestStart', async () => {
            const http: LowLevelHandler = async function* (raw) {
                const {uri: {path}} = await consumeRequestStart(raw);
                // Note: the "raw" request is no longer a full request as the first line has been consumed
                // So we no longer have type safety and if we passed the request down
                // bad things would happen
                if (path === "/path") yield* ok();
                else yield* notFound();
            };

            const res = await response(http(get('/path')));

            expect(res.status).to.eql(200);
        });

        it('can route via Headers', async () => {
            const http: LowLevelHandler = async function* (raw) {
                // TODO: convenience vs explicitness (I chose explicit in low level API
                // convenience would have allowed consumeHeader to throw away RequestLine
                await consumeRequestStart(raw);
                const {Accept} = await consumeHeaders(raw);
                if (Accept === 'plain/text') yield* ok();
                else yield* notFound();
            };

            const res = await response(http(get('/path', {Accept: 'plain/text'})));

            expect(res.status).to.eql(200);
        });
    });

    describe("closable", () => {
        it('can be cancelled early', async () => {
            let closed = false;
            const http: LowLevelHandler = async function* (raw) {
                try {
                    yield {status: 100, statusDescription: 'Continue'};
                    yield {'Content-Type': 'plain/text'};
                    yield new StringBody('Hello');
                } finally {
                    closed = true;
                }
            };

            const response = http(get('/another'));

            // If you don't call next at least once you won't be inside the try / finally
            expect(await response.next()).to.eql({value: {status: 100, statusDescription: 'Continue'}, done: false});
            expect(closed).to.eql(false);
            expect(await response.return(undefined)).to.eql({value: undefined, done: true});
            expect(closed).to.eql(true);
        });

        it('will close if you iterate to the end', async () => {
            let closed = false;
            const http: LowLevelHandler = async function* (raw) {
                try {
                    yield {status: 100, statusDescription: 'Continue'};
                    yield {'Content-Type': 'plain/text'};
                } finally {
                    closed = true;
                }
            };

            await response(http(get('/another')));
            expect(closed).to.eql(true);
        });

        it('still closes even if you throw', async () => {
            let closed = false;
            const http: LowLevelHandler = async function* (raw) {
                try {
                    throw new Error('Ignore me');
                } finally {
                    closed = true;
                }
            };

            try {
                await response(http(get('/another')));
            } catch (e) {
            }
            expect(closed).to.eql(true);
        });
    })
});