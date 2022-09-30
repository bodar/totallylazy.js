import {spawn, CommonSpawnOptions} from 'child_process';
import {AsyncIterableWithReturn, AsyncIteratorHandler} from "./collections";

export interface RunOptions extends CommonSpawnOptions {
    command: string[];
}

export function run(options: RunOptions): AsyncIterableWithReturn<string, number> {
    const handler = new AsyncIteratorHandler<string, number>();
    const [command, ...args] = options.command;
    const process = spawn(command, args, {
        ...options,
        stdio: ['ignore', 'pipe', 'pipe']
    });

    process.stdout.on('data', (data: Buffer | string) => handler.value(data.toString()));
    process.stderr.on('data', (data: Buffer | string) => handler.value(data.toString()));
    process.on('error', e => handler.error(e));
    process.on('close', (code) => handler.close(code));
    return handler;
}