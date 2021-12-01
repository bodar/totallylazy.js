import {File} from './files';
import {spawn, CommonSpawnOptions} from 'child_process';
import {AsyncIteratorHandler} from "./collections";
import {connect, createServer} from 'net';

export interface RunOptions extends CommonSpawnOptions {
    command: string;
    arguments?: string[];
}

function uuid(a?: any, b?: any) {
    for (b = a = ''; a++ < 36; b += a * 51 & 52 ? (a ^ 15 ? 8 ^ Math.random() * (a ^ 20 ? 16 : 4) : 4).toString(16) : '-') ;
    return b
}

export function run(options: RunOptions): AsyncIterable<string> {
    const handle = File.tempDirectory.child(`totallylazy.js-${uuid()}`).absolutePath;
    const handler = new AsyncIteratorHandler<string>();
    const server = createServer(connection => {
        connection.on('data', (data: Buffer | string) => handler.value(data.toString()));
    }).listen(handle);
    const client = connect(handle);
    const process = spawn(options.command, options.arguments || [], {
        ...options,
        stdio: ['ignore', client, client]
    });
    process.on('close', (code) => {
        client.end();
        server.close();
        if (code === 0) {
            handler.close();
        } else {
            handler.error(Object.assign(new Error(`Process returned exit code: ${code}`), {code}));
        }
    });
    return handler;
}