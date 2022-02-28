/// <reference types="node" />
import { Stats } from "fs";
import { Readable, Writable } from 'stream';
export declare class File {
    absolutePath: string;
    constructor(pathOrName: string, parent?: string | File);
    static workingDirectory: File;
    static tempDirectory: File;
    get name(): string;
    get url(): string;
    child(name: string): File;
    children(): AsyncIterable<File>;
    get isDirectory(): Promise<boolean>;
    get exists(): Promise<boolean>;
    get stats(): Promise<Stats>;
    descendants(): AsyncIterable<File>;
    bytes(): Promise<Uint8Array>;
    content(newContent?: string): Promise<string>;
    read(options?: StreamOptions): Readable;
    append(data: any, options?: FileOptions): Promise<void>;
    write(options?: StreamOptions): Writable;
    mkdir(): Promise<File>;
    delete(): Promise<void>;
    copy(destination: string | File, flags?: number): Promise<void>;
}
export declare type FileOptions = {
    encoding?: string | null;
    mode?: string | number;
    flag?: string;
} | string;
export declare type StreamOptions = string | {
    flags?: string;
    encoding?: string;
    fd?: number;
    mode?: number;
    autoClose?: boolean;
    start?: number;
    end?: number;
    highWaterMark?: number;
};
