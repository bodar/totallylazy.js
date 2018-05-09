import {assert} from 'chai';
import {handlerContract} from "./handler.contract";
import {HttpBinHandler} from "./httpbin";

describe("HttpBinHandler", function () {
    handlerContract(async () => {
        return new HttpBinHandler();
    });
});
