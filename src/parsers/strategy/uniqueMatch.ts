import {PrefixTree} from "../../trie";
import {Datum} from "../datum";
import {flatten, unique} from "../../arrays";

export function uniqueMatch<V>(prefixTree: PrefixTree<Datum<V>[]>, value: string): V | undefined {
    const matches = flatten(prefixTree.match(value));
    const data = unique(matches.map(d => d.value));
    if (data.length != 1) return undefined;
    return data[0];
}