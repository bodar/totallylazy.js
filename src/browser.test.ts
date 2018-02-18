import {assert} from 'chai';
import {get} from "./api";
import {XmlHttpHandler} from "./browser";

const implemenations = [() => {
    if(typeof XMLHttpRequest == 'undefined') {
        console.log('skipping test as XMLHttpRequest object is required');
    } else {
        return new XmlHttpHandler();
    }
}];

implemenations.forEach((init) => {
    let handler = init();
    if(typeof handler != 'undefined') {
        describe(handler.constructor.name, function () {
            it("supports HTTP get", function(done: () => {}) {
                handler.handle(get('https://httpbin.org/')).then((response) => {
                    assert(response.status == 200);
                    done();
                }, reason => {
                    assert(reason == 'Ooops');
                    done();
                });
            });
        });
    }
});
