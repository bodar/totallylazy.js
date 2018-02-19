import {assert} from 'chai';
import {get, Handler} from "./http";
import {XmlHttpHandler} from "./browser";

const handlers: Handler[] = [];

if (typeof XMLHttpRequest != 'undefined') handlers.push(new XmlHttpHandler());

handlers.forEach((handler) => {
    describe(handler.constructor.name, function () {
        it("supports simple GET", function (done: () => {}) {
            handler.handle(get('https://httpbin.org/')).then((response) => {
                assert(response.status == 200);
                done();
            }, reason => {
                assert(reason == 'Ooops');
                done();
            });
        });
    });
});
