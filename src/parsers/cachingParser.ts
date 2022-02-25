import {Parser} from "./parser";
import {cache} from "../cache";

export class CachingParser<T> implements Parser<T> {
    constructor(private parser: Parser<T>) {
    }

    @cache parse(value: string): T {
        return this.parser.parse(value);
    }

    @cache parseAll(value: string): T[] {
        return this.parser.parseAll(value);
    }
}