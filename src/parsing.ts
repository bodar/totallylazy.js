import {characters, NamedMatch, NamedRegExp} from "./characters";
import {PrefixTree} from "./trie";
import {flatten, unique} from "./arrays";
import {array} from "./collections";
import {map} from "./transducers";

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

export interface Parser<T> {
    parse(value: string): T;

    parseAll(value: string): T[];
}

export interface Datum<V> {
    name: string;
    value: V;
}

export class DatumLookup<V> {
    private readonly prefixTree: PrefixTree<Datum<V>>;

    constructor(private readonly data: Datum<V>[]) {
        this.prefixTree = this.data.reduce((t, m) => {
            return t.insert(m.name, m);
        }, new PrefixTree<Datum<V>>());
    }

    parse(value: string): V {
        const data = unique(this.prefixTree.match(value).map(d => d.value));
        if (data.length != 1) throw new Error(`${this.constructor.name} - Unable to parse: ${value} matched : ${JSON.stringify(data)}`);
        const [datum] = data;
        return datum;
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