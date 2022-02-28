import {PrefixTree} from "../trie";
import {Datum} from "./core";
import {flatten, unique} from "../arrays";

export const boundaryDelimiters = ',.';

const trailingDelimiters = new RegExp(`[${boundaryDelimiters}]$`);
export function cleanValue(value: string): string {
    return value.replace(trailingDelimiters, '');
}

export function atBoundaryOnly(pattern: string): string {
    return `(?:^|\\s)${pattern}(?=[\\s${boundaryDelimiters}]|$)`;
}

export function uniqueMatch<V>(prefixTree: PrefixTree<Datum<V>[]>, value: string): V | undefined {
    const matches = flatten(prefixTree.match(value));
    const data = unique(matches.map(d => d.value));
    if (data.length != 1) return undefined;
    return data[0];
}