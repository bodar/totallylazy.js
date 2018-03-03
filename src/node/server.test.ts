import {assert} from 'chai';
import {handlerContract} from "../handler.contract";
import {HttpBinHandler} from "../httpbin";
import {Closeable, Handler} from "../api";

describe("NodeServerHandler", function () {
    function runningInNode() {
        return (typeof process !== 'undefined') && (typeof process.versions.node !== 'undefined')
    }

    let server:Handler & Closeable<void>;

    before(async function() {
        if (!runningInNode()) this.skip();

        const {NodeServerHandler} = await import('./server');
        server = new NodeServerHandler(new HttpBinHandler());
    });

    handlerContract(async () => {
        if (!runningInNode()) throw new Error("Unsupported");

        const {NodeClientHandler} = await import('./clients');
        return new NodeClientHandler();
    }, "localhost:8080");

    after(function(){
        if(server) return server.close();
    });
});
