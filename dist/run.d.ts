/// <reference types="node" />
import { CommonSpawnOptions } from 'child_process';
export interface RunOptions extends CommonSpawnOptions {
    command: string;
    arguments?: string[];
}
export declare function run(options: RunOptions): AsyncIterable<string>;
