import {characters, NamedMatch, NamedRegExp} from "./characters";
import {PrefixTree} from "./trie";
import {flatten, unique} from "./arrays";
import {array, Mapper} from "./collections";
import {flatMap, map} from "./transducers";

export abstract class BaseParser<T> implements Parser<T> {
    constructor(protected regex: NamedRegExp, protected locale?: string) {
    }

    parse(raw: string): T {
        const value = this.preProcess(raw);
        const match = this.regex.match(value);
        if (match.length === 0) throw new Error(`Generated regex ${this.regex.pattern} did not match "${value}" `);
        return this.convert(match);
    }

    parseAll(value: string): T[] {
        return array(this.regex.exec(this.preProcess(value)), map(this.convert))
    }

    preProcess(value: string) {
        return value;
    }

    abstract convert(matches: NamedMatch[]): T
}

export class MappingParser<A, B> implements Parser<B> {
    constructor(private parser: Parser<A>, private mapper: Mapper<A, B>) {
    }

    parse(value: string): B {
        return this.mapper(this.parser.parse(value));
    }

    parseAll(value: string): B[] {
        return array(this.parser.parseAll(value), flatMap(v => {
            try {
                return [this.mapper(v)]
            } catch (e) {
                return [];
            }
        }));
    }
}

export interface Parser<T> {
    parse(value: string): T;

    parseAll(value: string): T[];
}

export interface Datum<V> {
    name: string;
    value: V;
}

export class DatumLookup<V> {
    private readonly prefixTree: PrefixTree<Datum<V>[]>;

    constructor(private readonly data: Datum<V>[]) {
        this.prefixTree = this.data.reduce((t, m) => {
            const data = t.lookup(m.name) || [];
            data.push(m);
            return t.insert(m.name, data);
        }, new PrefixTree<Datum<V>[]>());
    }

    parse(value: string, strategy: MatchStrategy<V> = uniqueMatch): V {
        const matches: Datum<V>[] = flatten(this.prefixTree.match(value));
        const match = strategy(matches);
        if (typeof match === "undefined") throw new Error(`${this.constructor.name} - Unable to parse: ${value} matched : ${JSON.stringify(matches)}`);
        return match;
    }

    get pattern(): string {
        const [min, max] = this.data.reduce(([min, max], l) => {
            const length = characters(l.name).length;
            return [Math.min(min, length), Math.max(max, length)]
        }, [Number.MAX_VALUE, Number.MIN_VALUE]);
        return `[${this.characters.join('')}]{${min},${max}}`;
    }

    get characters(): string[] {
        return unique(flatten(this.data.map(d => d.name).map(characters))).sort();
    }
}

export type MatchStrategy<V> = (matches: Datum<V>[]) => V | undefined;

export function uniqueMatch<V>(matches: Datum<V>[]): V | undefined {
    const data = unique(matches.map(d => d.value));
    if (data.length != 1) return undefined;
    return data[0];
}

export function prefer<V>(...values:V[]): MatchStrategy<V> {
    return (matches: Datum<V>[]) => {
        const [match] = matches.filter(m => values.indexOf(m.value) !== -1);
        if(typeof match === "undefined") return uniqueMatch(matches);
        return match.value;
    };
}


export class CompositeParser<T> implements Parser<T> {
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
        throw new Error("Unable to parse date: " + value);
    }

    parseAll(value: string): T[] {
        return flatten(this.parsers.map(p => p.parseAll(value)));
    }
}

export function parsers<T>(...parsers: Parser<T>[]): Parser<T> {
    return new CompositeParser(parsers);
}