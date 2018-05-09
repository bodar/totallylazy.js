import {assert} from 'chai';
import {handlerContract} from "./handler.contract";

describe("XmlHttpHandler", function () {
    handlerContract(async () => {
        if (typeof XMLHttpRequest == 'undefined') throw new Error("Unsupported");

        const {XmlHttpHandler} = await import('./browser');
        return new XmlHttpHandler();
    });
});
