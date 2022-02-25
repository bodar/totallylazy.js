import {Parser} from "./parser";
import {flatten} from "../arrays";

export class AllParser<T> implements Parser<T> {
    constructor(private readonly parsers: Parser<T>[]) {
    }

    parse(value: string): T {
        throw new Error("Not supported, please call AllParser.parseAll");
    }

    parseAll(value: string): T[] {
        return flatten(this.parsers.map(p => p.parseAll(value)));
    }
}

export function all<T>(...parsers: Parser<T>[]): Parser<T> {
    return new AllParser(parsers);
}