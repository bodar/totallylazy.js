import {assert} from 'chai';
import {handlerContract} from "../handler.contract";
import {runningInNode} from "../../node";

describe("NodeClientHandler", function () {
    handlerContract(async () => {
        if (!runningInNode()) throw new Error("Unsupported");

        const {NodeClientHandler} = await import('./clients');
        return new NodeClientHandler();
    });
});
