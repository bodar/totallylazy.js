import {assert} from 'chai';
import {handlerContract} from "../handler.contract";

describe("XmlHttpHandler", function () {
    handlerContract(async () => {
        if (typeof XMLHttpRequest == 'undefined') return Promise.reject("");
        const {XmlHttpHandler} = await import('./browser');
        return new XmlHttpHandler();
    });
});
