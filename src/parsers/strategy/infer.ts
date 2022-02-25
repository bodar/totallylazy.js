import {PreferredCurrencies} from "../money/preferred-currencies";
import {PrefixTree} from "../../trie";
import {Datum} from "../datum";
import {unique} from "../../arrays";
import {MatchStrategy} from "./matchStrategy";

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