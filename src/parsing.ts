import {characters, NamedMatch, NamedRegExp} from "./characters";
import {DEFAULT_COMPARATOR, PrefixTree} from "./trie";
import {flatten, unique} from "./arrays";
import {array, Comparator, Mapper} from "./collections";
import {flatMap, map, zip} from "./transducers";
import {cache, caching} from "./cache";
import {PreferredCurrencies} from "./money/preferred-currencies";
import {get} from "./functions";

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

export class PreProcessor<T> implements Parser<T> {
    constructor(private delegate: Parser<T>, private mapper: Mapper<string, string>) {
    }

    parse(value: string): T {
        return this.delegate.parse(this.mapper(value));
    }

    parseAll(value: string): T[] {
        return this.delegate.parseAll(this.mapper(value));
    }
}

export function preProcess<T>(delegate: Parser<T>, mapper: Mapper<string, string>) {
    return new PreProcessor(delegate, mapper);
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

export function mappingParser<A, B>(parser: Parser<A>, mapper: Mapper<A, B>) {
    return new MappingParser(parser, mapper);
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

export type MatchStrategy<V> = (prefixTree: PrefixTree<Datum<V>[]>, value: string) => V | undefined;

export function uniqueMatch<V>(prefixTree: PrefixTree<Datum<V>[]>, value: string): V | undefined {
    const matches = flatten(prefixTree.match(value));
    const data = unique(matches.map(d => d.value));
    if (data.length != 1) return undefined;
    return data[0];
}

export function prefer<V>(...values: V[]): MatchStrategy<V> {
    return (prefixTree: PrefixTree<Datum<V>[]>, value: string) => {
        const matches = prefixTree.lookup(value) || [];
        const data = unique(matches.map(d => d.value));
        if (data.length === 0) return;
        if (data.length === 1) return data[0];
        const [match] = data.filter(m => values.indexOf(m) !== -1);
        return match;
    };
}

function localeParts(locale: string): string[] {
    if (!locale) return [];
    return locale.split(/[-_]/).filter(Boolean);
}

export function infer(locale: string): MatchStrategy<string> {
    const [, country] = localeParts(locale);
    return prefer(...PreferredCurrencies.for(country))
}

export class OrParser<T> implements Parser<T> {
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
        throw new Error("Unable to value: " + value);
    }

    parseAll(value: string): T[] {
        for (const parser of this.parsers) {
            const result = parser.parseAll(value);
            if (result.length > 0) return result;
        }
        return [];
    }
}

export function or<T>(...parsers: Parser<T>[]): Parser<T> {
    return new OrParser(parsers);
}

export function parsers<T>(...parsers: Parser<T>[]): Parser<T> {
    return or(...parsers);
}

export class AllParser<T> implements Parser<T> {
    constructor(private readonly parsers: Parser<T>[]) {
    }

    parse(value: string): T {
        throw new Error("Not supported, please call AllParser.parseAll");
    }

    parseAll(value: string): T[] {
        return flatten(this.parsers.map(p => p.parseAll(value)));
    }
}

export function all<T>(...parsers: Parser<T>[]): Parser<T> {
    return new AllParser(parsers);
}

export class CachingParser<T> implements Parser<T> {
    constructor(private parser: Parser<T>) {
    }

    @cache parse(value: string): T {
        return this.parser.parse(value);
    }

    @cache parseAll(value: string): T[] {
        return this.parser.parseAll(value);
    }
}

export const boundaryDelimiters = ',.';

export function atBoundaryOnly(pattern: string) {
    return `(?:^|\\s)${pattern}(?=[\\s${boundaryDelimiters}]|$)`;
}

export type Numeral = Datum<number>;

export class Numerals extends DatumLookup<number> {
    static cache: { [key: string]: Numerals } = {};

    static get(locale: string, additionalData: Numeral[] = []): Numerals {
        return Numerals.cache[locale] = Numerals.cache[locale] || Numerals.create(locale, additionalData);
    }

    static create(locale: string, additionalData: Numeral[] = []): Numerals {
        return new Numerals([...Numerals.generateData(locale), ...additionalData]);
    }

    static generateData(locale: string): Numeral[] {
        const digits = new Intl.NumberFormat(locale, {useGrouping: false}).format(1234567890).replace(/[,. '٬٫]/g, '');
        return array(characters(digits), zip([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]), map(([c, d]) => ({name: c, value: d})));
    }

    parse(value: string): number {
        const number = numberOf(value);
        return !isNaN(number) ? number : super.parse(value);
    }
}

export function digits(locale: string): string {
    return `\\d${Numerals.get(locale).characters.join('')}`;
}

export class Spaces {
    static codes: string[] = [32, 160, 8239].map(code => String.fromCharCode(code));
    static spaces = Spaces.codes.join('');
    static pattern = new RegExp(`[${Spaces.spaces}]`, 'g');

    static handle(value: string): string {
        return Spaces.codes.indexOf(value) != -1 ? Spaces.spaces : value;
    }
}

const allowedSeparators = `٬٫,.'’${Spaces.spaces}`;
export const numberPattern = caching((locale: string) => {
    const d = digits(locale);
    return `(?:[${d}]+[${allowedSeparators}])*[${d}]+`;
});

export function mapIgnoreError<A, B>(mapper: Mapper<A, B>) {
    return flatMap((value: A) => {
        try {
            return [mapper(value)]
        } catch (e) {
            return [];
        }
    });
}

const separatorsPattern = NamedRegExp.create(`(?<separator>[${allowedSeparators}])`);

export function separatorsOf(amount: string): string[] {
    return array(separatorsPattern.exec(amount), map(([match]) => match.value));
}

export type AllowedDecimalSeparators = '.' | ',' | '٫'

export class NumberParser implements Parser<number> {
    readonly strictNumberPattern: RegExp;
    readonly globalNumberPattern: NamedRegExp;

    constructor(private decimalSeparator: AllowedDecimalSeparators, private locale: string) {
        this.strictNumberPattern = new RegExp(`^${numberPattern(locale)}$`);
        this.globalNumberPattern = NamedRegExp.create(`(?<number>${numberPattern(locale)})`, 'g');
    }

    parse(value: string): number {
        if (!this.strictNumberPattern.test(value)) throw new Error(`Unable to parse '${value}'`);
        return this.parseSingle(value);
    }

    parseAll(value: string): number[] {
        return array(this.globalNumberPattern.exec(value), mapIgnoreError(([match]) => this.parseSingle(match.value.trim())));
    }

    private parseSingle(value: string): number {
        const separators = separatorsOf(value);
        if (separators.length === 0) return this.numberOf(value);
        const lastSeparator = separators[separators.length - 1];
        const groupSeparators = lastSeparator === this.decimalSeparator ? separators.slice(0, separators.length - 1) : separators;
        if (groupSeparators.indexOf(this.decimalSeparator) !== -1) throw new Error(`Unable to parse '${value}'`);
        if (unique(groupSeparators).length > 1) throw new Error(`Unable to parse '${value}'`);

        return this.numberOf(value);
    }

    private convert(value: string): string {
        const numerals = Numerals.get(this.locale);
        return characters(value).map(c => {
            if (c === this.decimalSeparator) return '.';
            const number = get(() => numerals.parse(c));
            if (isNaN(number)) return '';
            return number.toString();
        }).join('');
    }

    private numberOf(value: string) {
        const text = this.convert(value);
        const result = numberOf(text);
        if (isNaN(result)) {
            throw new Error(`Unable to parse '${value}'`);
        }
        return result;
    }
}

export function numberParser(decimalSeparator: AllowedDecimalSeparators, locale: string = 'en') {
    return new NumberParser(decimalSeparator, locale);
}

export function numberOf(value:string): number {
    if(!value || value.trim().length === 0) return NaN;
    return Number(value);
}