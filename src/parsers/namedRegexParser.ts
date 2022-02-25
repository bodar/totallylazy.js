import {NamedMatch, NamedRegExp} from "../characters";
import {array} from "../array";
import {Parser} from "./parser";

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