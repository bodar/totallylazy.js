import {NamedMatch, NamedRegExp, removeUnicodeMarkers} from "./characters";
import {Mapper} from "./collections";
import {flatMap} from "./transducers";
import {cache} from "./cache";
import {array} from "./array";

export class NamedRegexParser implements Parser<NamedMatch[]> {
    constructor(protected regex: NamedRegExp) {
    }

    parse(value: string): NamedMatch[] {
        const match = this.regex.match(value);
        if (match.length === 0) throw new Error(`Generated regex ${this.regex.pattern} did not match "${value}" `);
        return match;
    }

    parseAll(value: string): NamedMatch[][] {
        return array(this.regex.exec(value));
    }
}

export function namedRegexParser(regex: NamedRegExp) {
    return new NamedRegexParser(regex);
}

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

export class MappingParser<A, B> implements Parser<B> {
    constructor(private parser: Parser<A>, private mapper: Mapper<A, B>) {
    }

    parse(value: string): B {
        return this.mapper(this.parser.parse(removeUnicodeMarkers(value)));
    }

    parseAll(value: string): B[] {
        if (!value) return [];
        return array(this.parser.parseAll(removeUnicodeMarkers(value)), flatMap(v => {
            try {
                return [this.mapper(v)]
            } catch (e) {
                return [];
            }
        }));
    }
}

export function mappingParser<A, B>(parser: Parser<A>, mapper: Mapper<A, B>) {
    return new MappingParser(parser, mapper);
}

export interface Parser<T> {
    parse(value: string): T;

    parseAll(value: string): T[];
}

export class IdentityParser implements Parser<string> {
    parse(value: string): string {
        return value;
    }

    parseAll(value: string): string[] {
        return [value];
    }
}

export class FailParser implements Parser<any> {
    parse(value: string): any {
        throw new Error();
    }

    parseAll(value: string): any[] {
        return [];
    }
}

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

export function parsers<T>(...parsers: Parser<T>[]): Parser<T> {
    return or(...parsers);
}

export class AllParser<T> implements Parser<T> {
    constructor(private readonly parsers: Parser<T>[]) {
    }

    parse(value: string): T {
        throw new Error("Not supported, please call AllParser.parseAll");
    }

    parseAll(value: string): T[] {
        return this.parsers.flatMap(p => p.parseAll(value));
    }
}

export function all<T>(...parsers: Parser<T>[]): Parser<T> {
    return new AllParser(parsers);
}

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

export const extraDelimiters = ' -/';


