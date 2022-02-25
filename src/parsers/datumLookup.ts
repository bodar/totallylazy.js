import {DEFAULT_COMPARATOR, PrefixTree} from "../trie";
import {Datum} from "./datum";
import {Comparator} from "../collections";
import {MatchStrategy} from "./strategy/matchStrategy";
import {uniqueMatch} from "./strategy/uniqueMatch";
import {flatten, unique} from "../arrays";
import { characters } from '../characters';

export class DatumLookup<V> {
    private readonly prefixTree: PrefixTree<Datum<V>[]>;

    constructor(private readonly data: Datum<V>[], comparator: Comparator<string> = DEFAULT_COMPARATOR) {
        this.prefixTree = this.data.reduce((t, m) => {
            const data = t.lookup(m.name) || [];
            data.push(m);
            return t.insert(m.name, data);
        }, new PrefixTree<Datum<V>[]>(undefined, comparator));
    }

    parse(value: string, strategy: MatchStrategy<V> = uniqueMatch): V {
        const match = strategy(this.prefixTree, value);
        if (typeof match === "undefined") throw new Error(`${this.constructor.name} - Unable to parse: ${value}`);
        return match;
    }

    get pattern(): string {
        return `[${this.characters.join('')}]{1,${this.max}}`;
    }

    get max(): number {
        return this.data.reduce((max, l) => {
            const length = characters(l.name).length;
            return Math.max(max, length);
        }, Number.MIN_VALUE);
    }

    get characters(): string[] {
        return unique(flatten(this.data.map(d => d.name).map(characters))).sort();
    }
}