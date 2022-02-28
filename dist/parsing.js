"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.numberOf = exports.inferDecimalSeparator = exports.numberParser = exports.NumberParser = exports.decimalSeparator = exports.isDecimalSeparator = exports.separatorsOf = exports.mapIgnoreError = exports.numberPattern = exports.Spaces = exports.digits = exports.numberFormatter = exports.Numerals = exports.atBoundaryOnly = exports.cleanValue = exports.extraDelimiters = exports.boundaryDelimiters = exports.CachingParser = exports.all = exports.AllParser = exports.parsers = exports.or = exports.OrParser = exports.infer = exports.prefer = exports.uniqueMatch = exports.DatumLookup = exports.FailParser = exports.IdentityParser = exports.mappingParser = exports.MappingParser = exports.preProcess = exports.PreProcessor = exports.namedRegexParser = exports.NamedRegexParser = void 0;
const tslib_1 = require("tslib");
const characters_1 = require("./characters");
const trie_1 = require("./trie");
const arrays_1 = require("./arrays");
const collections_1 = require("./collections");
const transducers_1 = require("./transducers");
const cache_1 = require("./cache");
const preferred_currencies_1 = require("./money/preferred-currencies");
const functions_1 = require("./functions");
class NamedRegexParser {
    constructor(regex) {
        this.regex = regex;
    }
    parse(value) {
        const match = this.regex.match(value);
        if (match.length === 0)
            throw new Error(`Generated regex ${this.regex.pattern} did not match "${value}" `);
        return match;
    }
    parseAll(value) {
        return (0, collections_1.array)(this.regex.exec(value));
    }
}
exports.NamedRegexParser = NamedRegexParser;
function namedRegexParser(regex) {
    return new NamedRegexParser(regex);
}
exports.namedRegexParser = namedRegexParser;
class PreProcessor {
    constructor(delegate, mapper) {
        this.delegate = delegate;
        this.mapper = mapper;
    }
    parse(value) {
        return this.delegate.parse(this.mapper(value));
    }
    parseAll(value) {
        return this.delegate.parseAll(this.mapper(value));
    }
}
exports.PreProcessor = PreProcessor;
function preProcess(delegate, mapper) {
    return new PreProcessor(delegate, mapper);
}
exports.preProcess = preProcess;
class MappingParser {
    constructor(parser, mapper) {
        this.parser = parser;
        this.mapper = mapper;
    }
    parse(value) {
        return this.mapper(this.parser.parse((0, characters_1.removeUnicodeMarkers)(value)));
    }
    parseAll(value) {
        if (!value)
            return [];
        return (0, collections_1.array)(this.parser.parseAll((0, characters_1.removeUnicodeMarkers)(value)), (0, transducers_1.flatMap)(v => {
            try {
                return [this.mapper(v)];
            }
            catch (e) {
                return [];
            }
        }));
    }
}
exports.MappingParser = MappingParser;
function mappingParser(parser, mapper) {
    return new MappingParser(parser, mapper);
}
exports.mappingParser = mappingParser;
class IdentityParser {
    parse(value) {
        return value;
    }
    parseAll(value) {
        return [value];
    }
}
exports.IdentityParser = IdentityParser;
class FailParser {
    parse(value) {
        throw new Error();
    }
    parseAll(value) {
        return [];
    }
}
exports.FailParser = FailParser;
class DatumLookup {
    constructor(data, comparator = trie_1.DEFAULT_COMPARATOR) {
        this.data = data;
        this.prefixTree = this.data.reduce((t, m) => {
            const data = t.lookup(m.name) || [];
            data.push(m);
            return t.insert(m.name, data);
        }, new trie_1.PrefixTree(undefined, comparator));
    }
    parse(value, strategy = uniqueMatch) {
        const match = strategy(this.prefixTree, value);
        if (typeof match === "undefined")
            throw new Error(`${this.constructor.name} - Unable to parse: ${value}`);
        return match;
    }
    get pattern() {
        return `[${this.characters.join('')}]{1,${this.max}}`;
    }
    get max() {
        return this.data.reduce((max, l) => {
            const length = (0, characters_1.characters)(l.name).length;
            return Math.max(max, length);
        }, Number.MIN_VALUE);
    }
    get characters() {
        return (0, arrays_1.unique)((0, arrays_1.flatten)(this.data.map(d => d.name).map(characters_1.characters))).sort();
    }
}
exports.DatumLookup = DatumLookup;
function uniqueMatch(prefixTree, value) {
    const matches = (0, arrays_1.flatten)(prefixTree.match(value));
    const data = (0, arrays_1.unique)(matches.map(d => d.value));
    if (data.length != 1)
        return undefined;
    return data[0];
}
exports.uniqueMatch = uniqueMatch;
function prefer(...values) {
    if (values.filter(Boolean).length === 0)
        return undefined;
    return (prefixTree, value) => {
        const matches = prefixTree.lookup(value) || [];
        const data = (0, arrays_1.unique)(matches.map(d => d.value));
        if (data.length === 0)
            return;
        if (data.length === 1)
            return data[0];
        return data.find(m => values.indexOf(m) !== -1);
    };
}
exports.prefer = prefer;
function localeParts(locale) {
    if (!locale)
        return [];
    return locale.split(/[-_]/).filter(Boolean);
}
function infer(locale) {
    const [, country] = localeParts(locale);
    const preferred = preferred_currencies_1.PreferredCurrencies.for(country);
    return (prefixTree, value) => {
        const matches = prefixTree.lookup(value) || [];
        const allCodes = (0, arrays_1.unique)(matches.map(d => d.value));
        if (allCodes.length === 0)
            return;
        if (allCodes.length === 1)
            return allCodes[0];
        const bestMatch = allCodes.filter(iso => iso.startsWith(country));
        if (bestMatch.length === 1)
            return bestMatch[0];
        return allCodes.find(m => preferred.indexOf(m) !== -1);
    };
}
exports.infer = infer;
class OrParser {
    constructor(parsers) {
        this.parsers = parsers;
    }
    parse(value) {
        for (const parser of this.parsers) {
            try {
                const result = parser.parse(value);
                if (result)
                    return result;
            }
            catch (ignore) {
            }
        }
        throw new Error(`Unable to parse value: ${value}`);
    }
    parseAll(value) {
        for (const parser of this.parsers) {
            const result = parser.parseAll(value);
            if (result.length > 0)
                return result;
        }
        return [];
    }
}
exports.OrParser = OrParser;
function or(...parsers) {
    return new OrParser(parsers);
}
exports.or = or;
function parsers(...parsers) {
    return or(...parsers);
}
exports.parsers = parsers;
class AllParser {
    constructor(parsers) {
        this.parsers = parsers;
    }
    parse(value) {
        throw new Error("Not supported, please call AllParser.parseAll");
    }
    parseAll(value) {
        return (0, arrays_1.flatten)(this.parsers.map(p => p.parseAll(value)));
    }
}
exports.AllParser = AllParser;
function all(...parsers) {
    return new AllParser(parsers);
}
exports.all = all;
class CachingParser {
    constructor(parser) {
        this.parser = parser;
    }
    parse(value) {
        return this.parser.parse(value);
    }
    parseAll(value) {
        return this.parser.parseAll(value);
    }
}
(0, tslib_1.__decorate)([
    cache_1.cache
], CachingParser.prototype, "parse", null);
(0, tslib_1.__decorate)([
    cache_1.cache
], CachingParser.prototype, "parseAll", null);
exports.CachingParser = CachingParser;
exports.boundaryDelimiters = ',.';
exports.extraDelimiters = ' -/';
const trailingDelimiters = new RegExp(`[${exports.boundaryDelimiters}]$`);
function cleanValue(value) {
    return value.replace(trailingDelimiters, '');
}
exports.cleanValue = cleanValue;
function atBoundaryOnly(pattern) {
    return `(?:^|\\s)${pattern}(?=[\\s${exports.boundaryDelimiters}]|$)`;
}
exports.atBoundaryOnly = atBoundaryOnly;
class Numerals extends DatumLookup {
    constructor(data, locale) {
        super(data);
        this.locale = locale;
    }
    static get(locale, additionalData = []) {
        return Numerals.cache[locale] = Numerals.cache[locale] || Numerals.create(locale, additionalData);
    }
    static create(locale, additionalData = []) {
        return new Numerals([...Numerals.generateData(locale), ...additionalData], locale);
    }
    static generateData(locale) {
        const digits = (0, exports.numberFormatter)(locale).format(1234567890).replace(/[,. '٬٫]/g, '');
        return (0, collections_1.array)((0, characters_1.characters)(digits), (0, transducers_1.zip)([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]), (0, transducers_1.map)(([c, d]) => ({ name: c, value: d })));
    }
    parse(value) {
        const number = numberOf(value);
        return !isNaN(number) ? number : super.parse(value);
    }
    format(value) {
        return (0, exports.numberFormatter)(this.locale).format(value);
    }
}
exports.Numerals = Numerals;
Numerals.cache = {};
exports.numberFormatter = (0, cache_1.caching)((locale) => new Intl.NumberFormat(locale, { useGrouping: false }));
exports.digits = (0, cache_1.caching)((locale) => {
    const characters = Numerals.get(locale).characters.join('');
    if (characters === '0123456789')
        return '\\d';
    return `\\d${characters}`;
});
class Spaces {
    static handle(value) {
        return Spaces.codes.indexOf(value) != -1 ? Spaces.spaces : value;
    }
}
exports.Spaces = Spaces;
Spaces.codes = [32, 160, 8239].map(code => String.fromCharCode(code));
Spaces.spaces = Spaces.codes.join('');
Spaces.pattern = new RegExp(`[${Spaces.spaces}]`, 'g');
const allowedSeparators = `٬٫,.'’‘${Spaces.spaces}`;
exports.numberPattern = (0, cache_1.caching)((locale) => {
    const d = (0, exports.digits)(locale);
    return `-?(?:[${d}]+[${allowedSeparators}])*[${d}]+`;
});
function mapIgnoreError(mapper) {
    return (0, transducers_1.flatMap)((value) => {
        try {
            return [mapper(value)];
        }
        catch (e) {
            return [];
        }
    });
}
exports.mapIgnoreError = mapIgnoreError;
const separatorsPattern = characters_1.NamedRegExp.create(`(?<separator>[${allowedSeparators}])`);
function separatorsOf(amount) {
    return (0, collections_1.array)(separatorsPattern.exec(amount), (0, transducers_1.map)(([match]) => match.value));
}
exports.separatorsOf = separatorsOf;
function isDecimalSeparator(value) {
    return value && typeof value === "string" && value === '.' || value === ',' || value === '٫';
}
exports.isDecimalSeparator = isDecimalSeparator;
function decimalSeparator(value) {
    if (isDecimalSeparator(value))
        return value;
    throw new Error(`Invalid decimal separator${value}`);
}
exports.decimalSeparator = decimalSeparator;
class NumberParser {
    constructor(decimalSeparator, locale) {
        this.decimalSeparator = decimalSeparator;
        this.locale = locale;
        this.strictNumberPattern = new RegExp(`^${(0, exports.numberPattern)(locale)}$`);
        this.globalNumberPattern = characters_1.NamedRegExp.create(`(?<number>${(0, exports.numberPattern)(locale)})`, 'g');
    }
    parse(value) {
        if (!this.strictNumberPattern.test(value))
            throw new Error(`Unable to parse '${value}'`);
        return this.parseSingle(value);
    }
    parseAll(value) {
        return (0, collections_1.array)(this.globalNumberPattern.exec(value), mapIgnoreError(([match]) => this.parseSingle(match.value.trim())));
    }
    parseSingle(value, decimalSeparator = this.decimalSeparator(value)) {
        const separators = separatorsOf(value);
        if (separators.length === 0)
            return this.numberOf(value, decimalSeparator);
        const lastSeparator = separators[separators.length - 1];
        const groupSeparators = lastSeparator === decimalSeparator ? separators.slice(0, separators.length - 1) : separators;
        if (groupSeparators.indexOf(decimalSeparator) !== -1)
            throw new Error(`Unable to parse '${value}'`);
        if ((0, arrays_1.unique)(groupSeparators).length > 1)
            throw new Error(`Unable to parse '${value}'`);
        return this.numberOf(value, decimalSeparator);
    }
    convert(value, decimalSeparator) {
        const numerals = Numerals.get(this.locale);
        return (0, characters_1.characters)(value).map(c => {
            if (c === decimalSeparator)
                return '.';
            if (c === '-')
                return '-';
            const number = (0, functions_1.get)(() => numerals.parse(c));
            if (isNaN(number))
                return '';
            return number.toString();
        }).join('');
    }
    numberOf(value, decimalSeparator) {
        const text = this.convert(value, decimalSeparator);
        const result = numberOf(text);
        if (isNaN(result)) {
            throw new Error(`Unable to parse '${value}'`);
        }
        return result;
    }
}
exports.NumberParser = NumberParser;
function numberParser(decimalSeparatorOrLocale, locale = 'en') {
    if (!decimalSeparatorOrLocale)
        return numberParser(locale);
    if (isDecimalSeparator(decimalSeparatorOrLocale))
        return new NumberParser(ignore => decimalSeparatorOrLocale, locale);
    return numberParser((0, exports.inferDecimalSeparator)(decimalSeparatorOrLocale), decimalSeparatorOrLocale);
}
exports.numberParser = numberParser;
exports.inferDecimalSeparator = (0, cache_1.caching)((locale) => (0, functions_1.get)(() => decimalSeparator(new Intl.NumberFormat(locale).formatToParts(.1).find(e => e.type === 'decimal').value), '.'));
function numberOf(value) {
    if (!value || value.trim().length === 0)
        return NaN;
    return Number(value);
}
exports.numberOf = numberOf;
//# sourceMappingURL=parsing.js.map