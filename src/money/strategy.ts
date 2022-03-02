import {Datum, MatchStrategy} from "../dates";
import {PrefixTree} from "../trie";
import {unique} from "../arrays";
import {PreferredCurrencies} from "./preferred-currencies";

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

function localeParts(locale: string): string[] {
    if (!locale) return [];
    return locale.split(/[-_]/).filter(Boolean);
}

export function infer(locale: string): MatchStrategy<string> {
    const [, country] = localeParts(locale);
    const preferred = PreferredCurrencies.for(country);

    return (prefixTree: PrefixTree<Datum<string>[]>, value: string) => {
        const matches = prefixTree.lookup(value) || [];
        const allCodes = unique(matches.map(d => d.value));
        if (allCodes.length === 0) return;
        if (allCodes.length === 1) return allCodes[0];

        const bestMatch = allCodes.filter(iso => iso.startsWith(country));
        if (bestMatch.length === 1) return bestMatch[0];

        return allCodes.find(m => preferred.indexOf(m) !== -1);
    };
}