import * as fs from 'fs';
import * as path from 'path';
import {promisify} from 'util';
import {lazy} from './lazy';
import {Stats} from "fs";

export interface FileLike {
    name: string,
    parent: string,
    absolutePath: string,
    isDirectory: Promise<boolean>,

    bytes(): Promise<Uint8Array>,
}

if (typeof Symbol.asyncIterator == 'undefined') {
    (Symbol as any).asyncIterator = Symbol.for("Symbol.asyncIterator");
}

export class File implements FileLike {
    constructor(public name: string, public parent: string = process.cwd()) {

    }

    get absolutePath(): string {
        return lazy(this, 'absolutePath', path.resolve(this.parent, this.name));
    }

    get url(): string {
        return `file://${this.absolutePath}`;
    }

    async * children(): AsyncIterable<File> {
        const names: string[] = await promisify(fs.readdir)(this.absolutePath);
        yield* names.map(name => new File(name, this.absolutePath));
    }

    get isDirectory(): Promise<boolean> {
        return lazy(this, 'isDirectory', this.stats.then(stat => stat.isDirectory()));
    }

    get exists(): Promise<boolean> {
        return lazy(this, 'exists', this.stats.then(ignore => true, ignore => false));
    }

    get stats(): Promise<Stats> {
        return lazy(this, 'stats', promisify(fs.lstat)(this.absolutePath));
    }

    async * descendants(): AsyncIterable<File> {
        for await (const child of this.children()) {
            yield child;
            if (await child.isDirectory) yield* child.descendants();
        }
    }

    async bytes(): Promise<Uint8Array> {
        return await promisify(fs.readFile)(this.absolutePath);
    }

    async content(): Promise<string> {
        return (await promisify(fs.readFile)(this.absolutePath, 'utf-8')).toString();
    }

    async append(data: any, options?: FileOptions): Promise<void> {
        return await promisify(fs.appendFile)(this.absolutePath, data, options)
    }

    async delete(): Promise<void> {
        try {
            if (await !this.exists) return Promise.resolve();
            if (await this.isDirectory) return await promisify(fs.rmdir)(this.absolutePath);
            return await promisify(fs.unlink)(this.absolutePath);
        } catch (e) {
            return Promise.reject(e);
        }
    }
}

export type FileOptions = { encoding?: string | null, mode?: string | number, flag?: string } | string

