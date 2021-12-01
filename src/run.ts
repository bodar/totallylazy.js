import {spawn, CommonSpawnOptions} from 'child_process';
import {AsyncIteratorHandler} from "./collections";

export interface RunOptions extends CommonSpawnOptions {
    command: string;
    arguments?: string[];
}

export function run(options: RunOptions): AsyncIterable<string> {
    const handler = new AsyncIteratorHandler<string>();
    const process = spawn(options.command, options.arguments || [], {
        ...options,
        stdio: ['ignore', 'pipe', 'pipe']
    });

    process.stdout.on('data', (data: Buffer | string) => handler.value(data.toString()));
    process.stderr.on('data', (data: Buffer | string) => handler.value(data.toString()));
    process.on('error', e => handler.error(e));
    process.on('close', (code) => {
        if (code === 0) {
            handler.close();
        } else {
            handler.error(Object.assign(new Error(`Command ${options.command} returned exit code ${code}`), {code}));
        }
    });
    return handler;
}