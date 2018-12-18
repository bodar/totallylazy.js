import {assert} from 'chai';
import {handlerContract} from "./handler.contract";
import {BinHandler} from "../../src/http/bin";

describe("HttpBinHandler", function () {
    handlerContract(async () => {
        return new BinHandler();
    });
});
