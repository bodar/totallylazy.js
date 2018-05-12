import * as fs from 'fs';
import * as path from 'path';
import {promisify} from 'util';
import {lazy} from './lazy';
import {Stats} from "fs";
import {sequence, Sequence} from "./sequence";

if (typeof Symbol.asyncIterator == 'undefined') {
    (Symbol as any).asyncIterator = Symbol.for("Symbol.asyncIterator");
}

export class File {
    constructor(public name: string, public parent: string = process.cwd()) {

    }

    get absolutePath(): string {
        return lazy(this, 'absolutePath', path.resolve(this.parent, this.name));
    }

    get url(): string {
        return `file://${this.absolutePath}`;
    }

    child(name:string){
        return new File(name, this.absolutePath);
    }

    async * children(): AsyncIterable<File> {
        const names: string[] = await promisify(fs.readdir)(this.absolutePath);
        yield* names.map(name => this.child(name));
    }

    get isDirectory(): Promise<boolean> {
        return this.stats.then(stat => stat.isDirectory());
    }

    get exists(): Promise<boolean> {
        return this.stats.then(ignore => true, ignore => false);
    }

    get stats(): Promise<Stats> {
        return promisify(fs.lstat)(this.absolutePath);
    }

    async * descendants(): AsyncIterable<File> {
        for await (const child of this.children()) {
            if (await child.isDirectory) yield* child.descendants();
            yield child;
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

    async mkdir(): Promise<File>{
        if(!await this.exists) await promisify(fs.mkdir)(this.absolutePath);
        return this;
    }

    async delete(): Promise<void> {
        if (!await this.exists) return Promise.resolve();
        if (await this.isDirectory) {
            for await (const descendant of this.descendants()) await descendant.delete();
            return await promisify(fs.rmdir)(this.absolutePath);
        }
        return await promisify(fs.unlink)(this.absolutePath);
    }

    async copy(destination: string | File, flags?: number): Promise<void> {
        destination = destination instanceof File ? destination : new File(destination);
        if(await this.isDirectory){
            const dest = await destination.child(this.name).mkdir();
            for await (const descendant of this.descendants()) await descendant.copy(dest, flags);
        } else {
            if(await destination.isDirectory) destination = destination.child(this.name);
            return await promisify(fs.copyFile)(this.absolutePath, destination.absolutePath, flags);
        }
    }

}

export type FileOptions = { encoding?: string | null, mode?: string | number, flag?: string } | string

