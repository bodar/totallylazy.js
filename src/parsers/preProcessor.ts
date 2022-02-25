import {Mapper} from "../collections";
import {Parser} from "./parser";

export class PreProcessor<T> implements Parser<T> {
    constructor(private delegate: Parser<T>, private mapper: Mapper<string, string>) {
    }

    parse(value: string): T {
        return this.delegate.parse(this.mapper(value));
    }

    parseAll(value: string): T[] {
        return this.delegate.parseAll(this.mapper(value));
    }
}

export function preProcess<T>(delegate: Parser<T>, mapper: Mapper<string, string>) {
    return new PreProcessor(delegate, mapper);
}