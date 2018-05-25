import {assert} from 'chai';
import {handlerContract} from "./handler.contract";
import {BinHandler} from "./bin";

describe("HttpBinHandler", function () {
    handlerContract(async () => {
        return new BinHandler();
    });
});
