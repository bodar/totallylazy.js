"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegerGroupParser = exports.PartsFromFormat = exports.NumberFormatPartParser = exports.MoneyParser = exports.RegexBuilder = exports.symbolFor = exports.CurrencySymbols = exports.parseToParts = exports.parser = exports.parse = exports.FormatToParts = exports.toPartsPonyfill = exports.format = exports.partsFrom = exports.hasNativeToParts = exports.Formatter = exports.decimalsFor = exports.moneyFrom = exports.money = void 0;
const tslib_1 = require("tslib");
const characters_1 = require("../characters");
const transducers_1 = require("../transducers");
const collections_1 = require("../collections");
const arrays_1 = require("../arrays");
const currencies_1 = require("./currencies");
const lazy_1 = require("../lazy");
const parsing_1 = require("../parsing");
const cache_1 = require("../cache");
const functions_1 = require("../functions");
function money(currency, amount) {
    return { amount, currency };
}
exports.money = money;
function moneyFrom(parts, locale, options) {
    const { currency } = (0, collections_1.single)(parts, (0, transducers_1.filter)(m => m.type === 'currency'), (0, transducers_1.flatMap)(m => {
        try {
            const currency = CurrencySymbols.get(locale).parse(m.value, options && options.strategy);
            return [{ currency, exactMatch: currency === m.value }];
        }
        catch (e) {
            return [];
        }
    }), (0, transducers_1.sort)((0, collections_1.by)('exactMatch', collections_1.descending)), (0, transducers_1.first)());
    const filtered = parts.filter(p => p.type === 'integer' || p.type === 'decimal' || p.type === 'fraction');
    const decimal = (0, functions_1.get)(() => parts.filter(p => p.type === 'decimal')[0].value, '.');
    const text = filtered.map(p => p.value).join('');
    const value = (0, parsing_1.numberParser)(decimal, locale).parse(text);
    return money(currency, value);
}
exports.moneyFrom = moneyFrom;
function decimalsFor(code) {
    const currency = currencies_1.currencies[code];
    return currency ? currency.decimals : 2;
}
exports.decimalsFor = decimalsFor;
class Formatter {
    static create(currency, locale, currencyDisplay = 'code') {
        return new Intl.NumberFormat(locale, {
            currencyDisplay,
            currency,
            style: 'currency',
            minimumFractionDigits: 0,
            maximumFractionDigits: decimalsFor(currency)
        });
    }
}
(0, tslib_1.__decorate)([
    cache_1.cache
], Formatter, "create", null);
exports.Formatter = Formatter;
exports.hasNativeToParts = typeof Intl.NumberFormat.prototype.formatToParts == 'function';
function partsFrom(money, locale, currencyDisplay = 'code', hasNative = exports.hasNativeToParts) {
    const formatter = Formatter.create(money.currency, locale, currencyDisplay);
    return hasNative ? formatter.formatToParts(money.amount) : toPartsPonyfill(money, locale, currencyDisplay);
}
exports.partsFrom = partsFrom;
function format(money, locale, currencyDisplay = 'code') {
    return Formatter.create(money.currency, locale, currencyDisplay).format(money.amount);
}
exports.format = format;
function toPartsPonyfill(actual, locale, currencyDisplay = 'code') {
    const currency = actual.currency;
    const amount = actual.amount;
    return FormatToParts.create(currency, locale, currencyDisplay).format(amount);
}
exports.toPartsPonyfill = toPartsPonyfill;
const exampleMoney = money('GBP', 111222.3333);
class FormatToParts {
    constructor(currency, currencyDisplay, parser, locale) {
        this.currency = currency;
        this.currencyDisplay = currencyDisplay;
        this.parser = parser;
        this.locale = locale;
    }
    static create(currency, locale, currencyDisplay = 'code') {
        const exampleFormatted = Formatter.create(currency, locale, currencyDisplay).format(exampleMoney.amount);
        const exampleParts = PartsFromFormat.examplePattern(locale).parse(exampleFormatted);
        const genericPattern = RegexBuilder.buildFrom(exampleParts, locale);
        const genericPartsParser = NumberFormatPartParser.create(locale, genericPattern);
        return new FormatToParts(currency, currencyDisplay, genericPartsParser, locale);
    }
    format(amount) {
        const formatter = Formatter.create(this.currency, this.locale, this.currencyDisplay);
        return this.parser.parse(formatter.format(amount));
    }
}
(0, tslib_1.__decorate)([
    cache_1.cache
], FormatToParts, "create", null);
exports.FormatToParts = FormatToParts;
function parse(value, locale, options) {
    return moneyFrom(parseToParts(value, locale, options), locale, options);
}
exports.parse = parse;
function parser(locale, options) {
    return MoneyParser.create(locale, options);
}
exports.parser = parser;
function parseToParts(value, locale, options) {
    return NumberFormatPartParser.create(locale, options).parse(value);
}
exports.parseToParts = parseToParts;
class CurrencySymbols extends parsing_1.DatumLookup {
    constructor(data, locale) {
        super(data.map(d => {
            return ({ name: (0, parsing_1.cleanValue)(d.name), value: d.value });
        }), collections_1.ascending);
        this.locale = locale;
    }
    static get(locale, additionalData = []) {
        return CurrencySymbols.cache[locale] = CurrencySymbols.cache[locale] || CurrencySymbols.create(locale, additionalData);
    }
    static set(locale, months) {
        return CurrencySymbols.cache[locale] = months;
    }
    static create(locale, additionalData = []) {
        return new CurrencySymbols([...CurrencySymbols.generateData(locale), ...additionalData], locale);
    }
    static generateData(locale) {
        return (0, arrays_1.flatten)(Object.keys(currencies_1.currencies).map(c => CurrencySymbols.dataFor(locale, c, currencies_1.currencies[c])));
    }
    static dataFor(locale, iso, currency) {
        return [{ name: iso, value: iso },
            { name: symbolFor(locale, iso), value: iso },
            ...(0, collections_1.array)(currency.symbols, (0, transducers_1.flatMap)(s => {
                const result = [{ name: s, value: iso }];
                if (CurrencySymbols.generateAdditionalSymbols.indexOf(s) !== -1) {
                    const countyCode = iso.substring(0, 2);
                    result.push({ name: s + countyCode, value: iso });
                    result.push({ name: countyCode + s, value: iso });
                    result.push({ name: iso + s, value: iso });
                }
                return result;
            }))];
    }
    parse(value, strategy = (0, parsing_1.infer)(this.locale)) {
        return super.parse((0, parsing_1.cleanValue)(value), strategy);
    }
}
exports.CurrencySymbols = CurrencySymbols;
CurrencySymbols.cache = {};
CurrencySymbols.generateAdditionalSymbols = ['$', '¥', '£'];
const gbpSymbol = /[£GBP]+/;
function symbolFor(locale, isoCurrency, hasNative = exports.hasNativeToParts) {
    if (hasNative) {
        const parts = partsFrom(money(isoCurrency, 0), locale, "symbol");
        const [currency] = parts.filter(p => p.type === 'currency');
        if (!currency)
            throw new Error("No currency found");
        return currency.value;
    }
    else {
        const example = Formatter.create('GBP', locale, "symbol").format(1).replace(gbpSymbol, '@@@');
        const other = Formatter.create(isoCurrency, locale, "symbol").format(1);
        const [, result] = (0, characters_1.different)([example, other]);
        if (!result)
            return '£';
        return result.replace(parsing_1.Spaces.pattern, '');
    }
}
exports.symbolFor = symbolFor;
class RegexBuilder {
    static buildFromOptions(locale, options) {
        return options && options.format ? this.buildFrom(PartsFromFormat.format.parse(options.format), locale, true) : this.buildPattern(locale, options && options.strict || false);
    }
    static buildPattern(locale, strict = false) {
        return this.buildFrom(partsFrom(exampleMoney, locale), locale, strict);
    }
    static buildFrom(raw, locale, strict = false) {
        const noGroups = this.buildParts(raw, strict);
        const [group = ''] = raw.filter(p => p.type === 'group').map(p => p.value);
        const d = (0, parsing_1.digits)(locale);
        const pattern = noGroups.map(part => {
            switch (part.type) {
                case "currency":
                    return `(?<currency>${CurrencySymbols.get(locale).pattern})?`;
                case "decimal":
                    return `(?<decimal>[${part.value}]?)`;
                case "fraction":
                    return `(?<fraction>[${d}]*)`;
                case "integer":
                    return `(?<integer-group>[${d}${parsing_1.Spaces.handle(group)}]*[${d}]+)`;
                default:
                    return `(?<${part.type}>[${parsing_1.Spaces.handle(part.value)}]?)`;
            }
        }).join("");
        return (0, parsing_1.atBoundaryOnly)(pattern);
    }
    static buildParts(raw, strict = false) {
        const parts = [...raw];
        if (!strict) {
            const first = parts[0];
            const last = parts[parts.length - 1];
            const literal = { type: "literal", value: ' ' };
            if (first.type === "currency") {
                parts.push(literal, first);
                parts.splice(1, 0, literal);
            }
            else if (last.type === "currency") {
                parts.unshift(last, literal);
                parts.splice(parts.length - 2, 0, literal);
            }
        }
        return (0, collections_1.array)(parts, (0, transducers_1.filter)(p => p.type !== 'group'), (0, transducers_1.dedupe)((0, collections_1.by)('type')));
    }
}
exports.RegexBuilder = RegexBuilder;
class MoneyParser {
    static create(locale, options) {
        return (0, parsing_1.mappingParser)(NumberFormatPartParser.create(locale, options), p => moneyFrom(p, locale, options));
    }
}
exports.MoneyParser = MoneyParser;
class NumberFormatPartParser {
    static create(locale, patternOrOption) {
        const pattern = typeof patternOrOption === "string" ? patternOrOption : RegexBuilder.buildFromOptions(locale, patternOrOption);
        return (0, parsing_1.mappingParser)((0, parsing_1.namedRegexParser)(characters_1.NamedRegExp.create(pattern)), m => this.convert(m, locale));
    }
    static convert(matches, locale) {
        return (0, collections_1.array)(matches, (0, transducers_1.filter)(m => Boolean(m.value)), (0, transducers_1.flatMap)((m) => {
            if (m.name === 'integer-group') {
                return IntegerGroupParser.digits(locale).parse(m.value);
            }
            else {
                return [{ type: m.name, value: m.value }];
            }
        }));
    }
}
(0, tslib_1.__decorate)([
    cache_1.cache
], NumberFormatPartParser, "create", null);
exports.NumberFormatPartParser = NumberFormatPartParser;
class PartsFromFormat {
    constructor(formatRegex, integerGroupParser) {
        this.formatRegex = formatRegex;
        this.integerGroupParser = integerGroupParser;
    }
    parse(format) {
        return (0, collections_1.array)(this.formatRegex.iterate(format), (0, transducers_1.flatMap)((matchOrNot) => {
            if ((0, characters_1.isNamedMatch)(matchOrNot)) {
                const [integerGroupOrCurrency, decimal, fractions] = matchOrNot.filter(m => Boolean(m.value));
                if (integerGroupOrCurrency.name === 'currency') {
                    return [{
                            type: integerGroupOrCurrency.name,
                            value: integerGroupOrCurrency.value
                        }];
                }
                else {
                    const integerAndGroups = this.integerGroupParser.parse(integerGroupOrCurrency.value);
                    if (decimal) {
                        return [...integerAndGroups,
                            { type: decimal.name, value: decimal.value },
                            { type: fractions.name, value: fractions.value }];
                    }
                    else {
                        return integerAndGroups;
                    }
                }
            }
            else {
                return [{ type: "literal", value: matchOrNot }];
            }
        }));
    }
    static get format() {
        const regex = characters_1.NamedRegExp.create('(?:(?<integer-group>(?:i.*i|i))(?:(?<decimal>[^f])(?<fraction>f+))?|(?<currency>C+))');
        return new PartsFromFormat(regex, IntegerGroupParser.integerFormat);
    }
    static examplePattern(locale) {
        const numerals = parsing_1.Numerals.get(locale);
        const regex = characters_1.NamedRegExp.create(`(?:(?<integer-group>${numerals.format(1)}.*${numerals.format(2)})(?:(?<decimal>.)(?<fraction>${numerals.format(3)}+))?|(?<currency>${CurrencySymbols.get(locale).pattern}))`);
        return new PartsFromFormat(regex, IntegerGroupParser.digits(locale));
    }
}
(0, tslib_1.__decorate)([
    lazy_1.lazy
], PartsFromFormat, "format", null);
(0, tslib_1.__decorate)([
    cache_1.cache
], PartsFromFormat, "examplePattern", null);
exports.PartsFromFormat = PartsFromFormat;
class IntegerGroupParser {
    constructor(regex) {
        this.regex = regex;
    }
    parse(value) {
        return (0, collections_1.array)(this.regex.iterate(value), (0, transducers_1.map)(m => {
            if ((0, characters_1.isNamedMatch)(m)) {
                return { type: 'integer', value: m[0].value };
            }
            else {
                return { type: 'group', value: m };
            }
        }));
    }
    static digits(locale) {
        return new IntegerGroupParser(characters_1.NamedRegExp.create(`(?<integer>[${(0, parsing_1.digits)(locale)}]+)`));
    }
    static get integerFormat() {
        return new IntegerGroupParser(characters_1.NamedRegExp.create('(?<integer>i+)'));
    }
}
(0, tslib_1.__decorate)([
    cache_1.cache
], IntegerGroupParser, "digits", null);
(0, tslib_1.__decorate)([
    lazy_1.lazy
], IntegerGroupParser, "integerFormat", null);
exports.IntegerGroupParser = IntegerGroupParser;
//# sourceMappingURL=money.js.map