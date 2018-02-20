import {assert} from 'chai';
import {handlerContract} from "../handler.contract";

describe("NodeClientHandler", function () {
    function runningInNode() {
        return (typeof process !== 'undefined') && (typeof process.versions.node !== 'undefined')
    }

    handlerContract(async () => {
        if (!runningInNode()) Promise.reject("");

        const {NodeClientHandler} = await import('./server');
        return new NodeClientHandler();
    });
});
