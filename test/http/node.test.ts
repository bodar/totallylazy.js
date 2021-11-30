import {handlerContract} from "./handler.contract";
import {runningInNode} from "../../src/node";
import {BinHandler} from "../../src/http/bin";
import {Server} from "../../src/http";

describe("ClientHandler", function () {
    handlerContract(async () => {
        if (!runningInNode()) throw new Error("Unsupported");

        const {ClientHandler} = await import('../../src/http/node');
        return new ClientHandler();
    });
});

describe("ServerHandler", function () {
    const server = new Promise<Server>(async (resolve, reject) => {
        try {
            const {ServerHandler} = await import('../../src/http/node');
            resolve(new ServerHandler(new BinHandler()));
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

        const {ClientHandler} = await import('../../src/http/node');
        return new ClientHandler();
    }, host());

    after(async function () {
        try {
            return (await server).close();
        } catch (ignore) {
        }
    });
});
