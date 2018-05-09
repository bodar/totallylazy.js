import {assert} from 'chai';
import {handlerContract} from "./handler.contract";
import {runningInNode} from "../node";
import {HttpBinHandler} from "./httpbin";
import {Server} from "./index";

describe("ClientHandler", function () {
    handlerContract(async () => {
        if (!runningInNode()) throw new Error("Unsupported");

        const {ClientHandler} = await import('./node');
        return new ClientHandler();
    });
});

describe("ServerHandler", function () {
    const server = new Promise<Server>(async (resolve, reject) => {
        try {
            const {ServerHandler} = await import('./node');
            resolve(new ServerHandler(new HttpBinHandler()));
        } catch (e) {
            reject(e);
        }
    });

    before(async function () {
        if (!runningInNode()) this.skip();
    });

    async function host(): Promise<string> {
        const s = await server;
        const url = await s.url();
        if (url.authority) return url.authority;
        throw new Error("Should never get here");
    }

    handlerContract(async () => {
        if (!runningInNode()) throw new Error("Unsupported");

        const {ClientHandler} = await import('./node');
        return new ClientHandler();
    }, host());

    after(async function () {
        try {
            return (await server).close();
        } catch (ignore) {
        }
    });
});
