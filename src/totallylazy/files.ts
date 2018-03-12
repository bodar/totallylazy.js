import * as fs from 'fs';
import * as path from 'path';
import {promisify} from 'util';
import {lazy} from './lazy';
import {Stats} from "fs";

export interface PathLike {
    name: string
    parent: string
    absolutePath: string
    isDirectory: Promise<boolean>
}

if (typeof Symbol.asyncIterator == 'undefined') {
    (Symbol as any).asyncIterator = Symbol.for("Symbol.asyncIterator");
}

export class Path implements PathLike {
    constructor(public name: string, public parent: string = process.cwd()) {

    }

    get absolutePath(): string {
        return lazy(this, 'absolutePath', path.resolve(this.parent, this.name));
    }

    async * children(): AsyncIterable<Path> {
        const names: string[] = await promisify(fs.readdir)(this.absolutePath);
        yield* names.map(name => new Path(name, this.absolutePath));
    }

    get isDirectory(): Promise<boolean> {
        return lazy(this, 'isDirectory', this.stats.then(stat => stat.isDirectory()));
    }

    get stats(): Promise<Stats> {
        return lazy(this, 'stats', promisify(fs.lstat)(this.absolutePath));
    }

    async * descendants(): AsyncIterable<Path> {
        for await (const child of this.children()) {
            yield child;
            if (await child.isDirectory) yield* child.descendants();
        }
    }
}

