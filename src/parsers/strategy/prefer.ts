import {PrefixTree} from "../../trie";
import {Datum} from "../datum";
import {unique} from "../../arrays";
import {MatchStrategy} from "./matchStrategy";

export function prefer<V>(value: undefined): undefined;
export function prefer<V>(...values: V[]): MatchStrategy<V>;
export function prefer<V>(...values: V[]): MatchStrategy<V> | undefined {
    if (values.filter(Boolean).length === 0) return undefined;
    return (prefixTree: PrefixTree<Datum<V>[]>, value: string) => {
        const matches = prefixTree.lookup(value) || [];
        const data = unique(matches.map(d => d.value));
        if (data.length === 0) return;
        if (data.length === 1) return data[0];
        return data.find(m => values.indexOf(m) !== -1);
    };
}