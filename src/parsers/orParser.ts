import {Parser} from "./parser";

export class OrParser<T> implements Parser<T> {
    constructor(private readonly parsers: Parser<T>[]) {
    }

    parse(value: string): T {
        for (const parser of this.parsers) {
            try {
                const result = parser.parse(value);
                if (result) return result;
            } catch (ignore) {
            }
        }
        throw new Error(`Unable to parse value: ${value}`);
    }

    parseAll(value: string): T[] {
        for (const parser of this.parsers) {
            const result = parser.parseAll(value);
            if (result.length > 0) return result;
        }
        return [];
    }
}

export function or<T>(...parsers: Parser<T>[]): Parser<T> {
    return new OrParser(parsers);
}

export const parsers = or;