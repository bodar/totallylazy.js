import {characters, NamedMatch, NamedRegExp, removeUnicodeMarkers} from "./characters";
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
        return this.mapper(this.parser.parse(removeUnicodeMarkers(value)));
    }

    parseAll(value: string): B[] {
        if (!value) return [];
        return array(this.parser.parseAll(removeUnicodeMarkers(value)), flatMap(v => {
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

export class IdentityParser implements Parser<string> {
    parse(value: string): string {
        return value;
    }

    parseAll(value: string): string[] {
        return [value];
    }
}

export class FailParser implements Parser<any> {
    parse(value: string): any {
        throw new Error();
    }

    parseAll(value: string): any[] {
        return [];
    }
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

export type MatchStrategy<V> = (prefixTree: PrefixTree<Datum<V>[]>, value: string) => V | undefined;

export function uniqueMatch<V>(prefixTree: PrefixTree<Datum<V>[]>, value: string): V | undefined {
    const matches = flatten(prefixTree.match(value));
    const data = unique(matches.map(d => d.value));
    if (data.length != 1) return undefined;
    return data[0];
}

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
        throw new Error(`Unable to parse value: ${value}`);
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
export const extraDelimiters = ' -/';

const trailingDelimiters = new RegExp(`[${boundaryDelimiters}]$`);

export function cleanValue(value: string): string {
    return value.replace(trailingDelimiters, '');
}

export function atBoundaryOnly(pattern: string): string {
    return `(?:^|\\s)${pattern}(?=[\\s${boundaryDelimiters}]|$)`;
}

export type Numeral = Datum<number>;

export class Numerals extends DatumLookup<number> {
    constructor(data: Datum<number>[], private locale: string) {
        super(data);
    }

    static cache: { [key: string]: Numerals } = {};

    static get(locale: string, additionalData: Numeral[] = []): Numerals {
        return Numerals.cache[locale] = Numerals.cache[locale] || Numerals.create(locale, additionalData);
    }

    static create(locale: string, additionalData: Numeral[] = []): Numerals {
        return new Numerals([...Numerals.generateData(locale), ...additionalData], locale);
    }

    static generateData(locale: string): Numeral[] {
        const digits = numberFormatter(locale).format(1234567890).replace(/[,. '٬٫]/g, '');
        return array(characters(digits), zip([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]), map(([c, d]) => ({name: c, value: d})));
    }

    parse(value: string): number {
        const number = numberOf(value);
        return !isNaN(number) ? number : super.parse(value);
    }

    format(value: number): string {
        return numberFormatter(this.locale).format(value);
    }
}

export const numberFormatter = caching((locale: string) => new Intl.NumberFormat(locale, {useGrouping: false}));


export const digits = caching((locale: string) => {
    const characters = Numerals.get(locale).characters.join('');
    if (characters === '0123456789') return '\\d';
    return `\\d${characters}`;
});

export class Spaces {
    static codes: string[] = [32, 160, 8239].map(code => String.fromCharCode(code));
    static spaces = Spaces.codes.join('');
    static pattern = new RegExp(`[${Spaces.spaces}]`, 'g');

    static handle(value: string): string {
        return Spaces.codes.indexOf(value) != -1 ? Spaces.spaces : value;
    }

    static remove(value: string): string {
        if (!value) return value;
        return value.replace(Spaces.pattern, '');
    }
}

const allowedSeparators = `٬٫,.'’‘${Spaces.spaces}`;
export const numberPattern = caching((locale: string) => {
    const d = digits(locale);
    return `-?(?:[${d}]+[${allowedSeparators}])*[${d}]+`;
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

export type AllowedDecimalSeparators = '.' | ',' | '٫';

export function isDecimalSeparator(value: any): value is AllowedDecimalSeparators {
    return value && typeof value === "string" && value === '.' || value === ',' || value === '٫';
}

export function decimalSeparator(value: any): AllowedDecimalSeparators {
    if (isDecimalSeparator(value)) return value;
    throw new Error(`Invalid decimal separator${value}`);
}


export class NumberParser implements Parser<number> {
    readonly strictNumberPattern: RegExp;
    readonly globalNumberPattern: NamedRegExp;

    constructor(private decimalSeparator: (amount: string) => AllowedDecimalSeparators, private locale: string) {
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

    private parseSingle(value: string, decimalSeparator = this.decimalSeparator(value)): number {
        const separators = separatorsOf(value);
        if (separators.length === 0) return this.numberOf(value, decimalSeparator);
        const lastSeparator = separators[separators.length - 1];
        const groupSeparators = lastSeparator === decimalSeparator ? separators.slice(0, separators.length - 1) : separators;
        if (groupSeparators.indexOf(decimalSeparator) !== -1) throw new Error(`Unable to parse '${value}'`);
        if (unique(groupSeparators).length > 1) throw new Error(`Unable to parse '${value}'`);

        return this.numberOf(value, decimalSeparator);
    }

    private convert(value: string, decimalSeparator: AllowedDecimalSeparators): string {
        const numerals = Numerals.get(this.locale);
        return characters(value).map(c => {
            if (c === decimalSeparator) return '.';
            if (c === '-') return '-';
            const number = get(() => numerals.parse(c));
            if (isNaN(number)) return '';
            return number.toString();
        }).join('');
    }

    private numberOf(value: string, decimalSeparator: AllowedDecimalSeparators) {
        const text = this.convert(value, decimalSeparator);
        const result = numberOf(text);
        if (isNaN(result)) {
            throw new Error(`Unable to parse '${value}'`);
        }
        return result;
    }
}

export type Locale = string;

export function numberParser(): Parser<number>;
export function numberParser(decimalSeparatorOrLocale: AllowedDecimalSeparators | Locale): Parser<number>;
export function numberParser(decimalSeparator: AllowedDecimalSeparators, locale: Locale): Parser<number>;
export function numberParser(decimalSeparatorOrLocale?: AllowedDecimalSeparators | Locale, locale: Locale = 'en'): Parser<number> {
    if (!decimalSeparatorOrLocale) return numberParser(locale);
    if (isDecimalSeparator(decimalSeparatorOrLocale)) return new NumberParser(ignore => decimalSeparatorOrLocale, locale);
    return numberParser(inferDecimalSeparator(decimalSeparatorOrLocale), decimalSeparatorOrLocale);
}

export const inferDecimalSeparator = caching((locale: string) =>
    get(() => decimalSeparator(new Intl.NumberFormat(locale).formatToParts(.1).find(e => e.type === 'decimal')!.value), '.'));

export function numberOf(value: string): number {
    if (!value || value.trim().length === 0) return NaN;
    return Number(value);
}