import {PrefixTree} from "../../trie";
import {Datum} from "../datum";

export type MatchStrategy<V> = (prefixTree: PrefixTree<Datum<V>[]>, value: string) => V | undefined;