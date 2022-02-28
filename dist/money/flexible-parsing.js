"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.implicitMoneyParser = exports.findDecimalSeparator = exports.flexibleMoneyParser = exports.FlexibleMoneyParser = exports.flexibleParse = void 0;
const tslib_1 = require("tslib");
const money_1 = require("./money");
const parsing_1 = require("../parsing");
const characters_1 = require("../characters");
const transducers_1 = require("../transducers");
const collections_1 = require("../collections");
const arrays_1 = require("../arrays");
const cache_1 = require("../cache");
const lazy_1 = require("../lazy");
const functions_1 = require("../functions");
function flexibleParse(value, locale = 'en', options) {
    return new FlexibleMoneyParser(locale, options).parse(value);
}
exports.flexibleParse = flexibleParse;
class FlexibleMoneyParser {
    constructor(locale, options) {
        this.locale = locale;
        this.options = options;
    }
    get pattern() {
        return FlexibleMoneyParser.patternFor(this.locale);
    }
    static patternFor(locale) {
        return characters_1.NamedRegExp.create((0, parsing_1.atBoundaryOnly)(`(?<currency>${money_1.CurrencySymbols.get(locale).pattern})?(?<literal>[${parsing_1.Spaces.spaces}])?(?<number>${(0, parsing_1.numberPattern)(locale)})(?<literal>[${parsing_1.Spaces.spaces}])?(?<currency>${money_1.CurrencySymbols.get(locale).pattern})?`));
    }
    parse(value) {
        try {
            return this.parseSingle(this.pattern.match((0, characters_1.removeUnicodeMarkers)(value)));
        }
        catch (e) {
            throw new Error(`Unable to parse ${value}`);
        }
    }
    parseAll(value) {
        return (0, collections_1.array)(this.pattern.exec((0, characters_1.removeUnicodeMarkers)(value)), (0, parsing_1.mapIgnoreError)(match => this.parseSingle(match)));
    }
    parseSingle(result) {
        const { currency } = (0, collections_1.single)(result, (0, transducers_1.filter)(m => m.name === 'currency' && m.value !== undefined), (0, transducers_1.flatMap)(m => {
            try {
                const currency = money_1.CurrencySymbols.get(this.locale).parse(m.value, (this.options && this.options.strategy) || (0, parsing_1.infer)(this.locale));
                return [{ currency, exactMatch: currency === m.value }];
            }
            catch (e) {
                return [];
            }
        }), (0, transducers_1.sort)((0, collections_1.by)('exactMatch', collections_1.descending)), (0, transducers_1.first)());
        const amount = (0, collections_1.single)(result, (0, transducers_1.find)(m => m.name === 'number' && m.value !== undefined)).value;
        const instance = (0, parsing_1.numberParser)((this.options && this.options.decimalSeparator) || findDecimalSeparator(currency, amount), this.locale);
        return (0, money_1.money)(currency, instance.parse(amount));
    }
}
(0, tslib_1.__decorate)([
    lazy_1.lazy
], FlexibleMoneyParser.prototype, "pattern", null);
(0, tslib_1.__decorate)([
    cache_1.cache
], FlexibleMoneyParser, "patternFor", null);
exports.FlexibleMoneyParser = FlexibleMoneyParser;
function flexibleMoneyParser(locale = 'en', options) {
    return new FlexibleMoneyParser(locale, options);
}
exports.flexibleMoneyParser = flexibleMoneyParser;
function flip(value) {
    return value === "." ? "," : ".";
}
function findDecimalSeparator(isoCurrency, amount) {
    const separators = (0, parsing_1.separatorsOf)(amount);
    if (separators.length === 0)
        return '.';
    const lastSeparator = separators[separators.length - 1];
    const placesFromTheEnd = amount.length - amount.lastIndexOf(lastSeparator) - 1;
    const decimalPlaces = (0, money_1.decimalsFor)(isoCurrency);
    if (separators.length === 1) {
        if (placesFromTheEnd === 3) {
            if (decimalPlaces === 3)
                throw new Error(`Can not parse ${amount} as separator is ambiguous`);
            return flip(lastSeparator);
        }
        return (0, parsing_1.decimalSeparator)(lastSeparator);
    }
    const uniqueSeparators = (0, arrays_1.unique)(separators);
    if (uniqueSeparators.length === 1)
        return flip(lastSeparator);
    return (0, parsing_1.decimalSeparator)(lastSeparator);
}
exports.findDecimalSeparator = findDecimalSeparator;
class ImplicitMoneyParser {
    constructor(currency, locale, parser = new parsing_1.NumberParser(amount => (0, functions_1.get)(() => findDecimalSeparator(currency, amount), (0, parsing_1.inferDecimalSeparator)(locale)), locale)) {
        this.currency = currency;
        this.parser = parser;
    }
    parse(value) {
        const amount = this.parser.parse(value);
        return { currency: this.currency, amount };
    }
    parseAll(value) {
        return this.parser.parseAll(value).map(amount => ({ amount, currency: this.currency }));
    }
}
function implicitMoneyParser({ currency, locale = 'en', strategy = (0, parsing_1.infer)(locale) }) {
    if (!currency)
        return new parsing_1.FailParser();
    return new ImplicitMoneyParser(money_1.CurrencySymbols.get(locale).parse(currency, strategy), locale);
}
exports.implicitMoneyParser = implicitMoneyParser;
//# sourceMappingURL=flexible-parsing.js.map