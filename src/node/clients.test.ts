import {assert} from 'chai';
import {handlerContract} from "../handler.contract";

describe("NodeClientHandler", function () {
    function runningInNode() {
        console.log("runningInNode", typeof process, process.versions);
        return (typeof process !== 'undefined') && (typeof process.versions.node !== 'undefined')
    }

    handlerContract(async () => {
        if (!runningInNode()) throw new Error("Unsupported");

        const {NodeClientHandler} = await import('./clients');
        return new NodeClientHandler();
    });
});
