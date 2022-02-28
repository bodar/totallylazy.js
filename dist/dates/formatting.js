"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateParts = exports.formatData = exports.hasNativeToParts = exports.SimpleFormat = exports.format = exports.ImprovedDateTimeFormat = exports.Formatters = void 0;
const tslib_1 = require("tslib");
const index_1 = require("./index");
const lazy_1 = require("../lazy");
const characters_1 = require("../characters");
const transducers_1 = require("../transducers");
const collections_1 = require("../collections");
const cache_1 = require("../cache");
const parsing_1 = require("../parsing");
class Formatters {
    static create(locale, options = index_1.defaultOptions) {
        if (typeof options === "string")
            return new SimpleFormat(locale, options);
        if (typeof options.format === "string")
            return new SimpleFormat(locale, options.format);
        return new ImprovedDateTimeFormat(locale, options);
    }
    // Slightly older versions of Safari implement the method but return an empty array!
    static isNativelySupported(locale, options = index_1.defaultOptions) {
        const formatter = this.dateTimeFormat(locale, options);
        return typeof formatter.formatToParts == 'function' && formatter.formatToParts(new Date()).length > 0;
    }
    static dateTimeFormat(locale, options) {
        return new Intl.DateTimeFormat(locale, Object.assign(Object.assign({}, options), { timeZone: 'UTC' }));
    }
}
(0, tslib_1.__decorate)([
    cache_1.cache
], Formatters, "create", null);
(0, tslib_1.__decorate)([
    cache_1.cache
], Formatters, "isNativelySupported", null);
exports.Formatters = Formatters;
class ImprovedDateTimeFormat {
    constructor(locale, options, delegate = ImprovedDateTimeFormat.create(locale, options)) {
        this.locale = locale;
        this.options = options;
        this.delegate = delegate;
    }
    static create(locale, options) {
        // Detect IE 11 bug
        const clone = Object.assign({}, options);
        const keys = Object.keys(clone).length;
        const result = Formatters.dateTimeFormat(locale, clone);
        if (Object.keys(clone).length != keys)
            throw new Error(`Unsupported DateTimeFormat options provided: ${JSON.stringify(options)}`);
        return result;
    }
    format(date) {
        return (0, characters_1.characters)(this.delegate.format(date)).join("");
    }
    formatToParts(date = new Date()) {
        if (Formatters.isNativelySupported(this.locale, this.options)) {
            return this.delegate.formatToParts(date);
        }
        else {
            return DateParts.create(this.locale, this.options).toParts(typeof date === "number" ? new Date(date) : date);
        }
    }
    resolvedOptions() {
        return this.delegate.resolvedOptions();
    }
}
exports.ImprovedDateTimeFormat = ImprovedDateTimeFormat;
function format(value, locale, options = index_1.defaultOptions) {
    if (value == undefined)
        throw new Error("Date format requires a value");
    return Formatters.create(locale, options).format(value);
}
exports.format = format;
class SimpleFormat {
    constructor(locale, value) {
        this.locale = locale;
        this.value = value;
        this.partsInOrder = (0, index_1.partsFrom)(value);
        this.options = (0, index_1.optionsFrom)(this.partsInOrder);
    }
    format(date) {
        return this.formatToParts(date).map(p => p.value).join("");
    }
    formatToParts(raw = new Date()) {
        const date = typeof raw === "number" ? new Date(raw) : raw;
        const partsWithValues = DateParts.create(this.locale, this.options).toParts(date);
        return this.partsInOrder.map(p => ({ type: p.type, value: this.valueFor(partsWithValues, p.type, p.value) }));
    }
    valueFor(partsWithValues, type, value) {
        if (type === 'literal')
            return value;
        return (0, index_1.valueFromParts)(partsWithValues, type);
    }
    resolvedOptions() {
        return Object.assign(Object.assign({}, this.options), { locale: this.locale });
    }
}
exports.SimpleFormat = SimpleFormat;
exports.hasNativeToParts = typeof Intl.DateTimeFormat.prototype.formatToParts == 'function';
function formatData(value, locale, options = index_1.defaultOptions, native = exports.hasNativeToParts) {
    const formatter = Formatters.create(locale, options);
    if (native)
        return formatter.formatToParts(value);
    return DateParts.create(locale, options).toParts(value);
}
exports.formatData = formatData;
class DateParts {
    constructor(locale, options = index_1.defaultOptions, yearValue = 3333, monthValue = 11, dayValue = 20, weekdayValue = index_1.Weekday.Friday, numerals = parsing_1.Numerals.get(locale)) {
        this.locale = locale;
        this.options = options;
        this.yearValue = yearValue;
        this.monthValue = monthValue;
        this.dayValue = dayValue;
        this.weekdayValue = weekdayValue;
        this.numerals = numerals;
    }
    static create(locale, options = index_1.defaultOptions) {
        return new DateParts(locale, options);
    }
    get formatter() {
        return Formatters.create(this.locale, this.options);
    }
    get formatted() {
        return this.formatter.format((0, index_1.date)(this.yearValue, this.monthValue, this.dayValue));
    }
    get months() {
        return index_1.Months.create(this.locale, index_1.Months.dataFor(this.locale, this.options, false));
    }
    get month() {
        return (0, index_1.months)(this.locale, this.options, false)[this.monthValue - 1];
    }
    get weekdays() {
        return new index_1.Weekdays(index_1.Weekdays.dataFor(this.locale, this.options, false));
    }
    get weekday() {
        return (0, index_1.weekdays)(this.locale, this.options, false)[this.weekdayValue - 1];
    }
    get year() {
        return this.numerals.format(this.yearValue);
    }
    get day() {
        return this.numerals.format(this.dayValue);
    }
    get learningNamesPattern() {
        const template = (key) => `(?<${key}>${this[key]})`;
        const patterns = Object.keys(this.options).map(k => template(k));
        const namedPattern = `(?:${patterns.join("|")})`;
        return characters_1.NamedRegExp.create(namedPattern);
    }
    get actualNamesPattern() {
        const d = (0, parsing_1.digits)(this.locale);
        const learningRegex = this.learningNamesPattern;
        const result = (0, collections_1.array)(learningRegex.iterate(this.formatted), (0, transducers_1.map)(value => {
            if ((0, characters_1.isNamedMatch)(value)) {
                let [type] = value.filter(n => Boolean(n.value)).map(n => n.name);
                if (!type)
                    throw new Error();
                if (type == 'year')
                    return `(?<year>[${d}]{4})`;
                else if (type == "day")
                    return `(?<day>[${d}]{1,2})`;
                else if (type == "month")
                    return `(?<month>(?:[${d}]{1,2}|${this.months.pattern}))`;
                else if (type == "weekday")
                    return `(?<weekday>${this.weekdays.pattern})`;
            }
            else {
                return `(?<literal>[${value}]+?)`;
            }
        }));
        const pattern = "^" + result.join("") + "$";
        return characters_1.NamedRegExp.create(pattern);
    }
    toParts(date) {
        const regex = this.actualNamesPattern;
        const actualResult = this.formatter.format(date);
        const match = regex.match(actualResult);
        if (match.length === 0) {
            throw new Error(`${regex} did not match ${actualResult}`);
        }
        const parts = match.map(m => {
            const type = this.getType(m.name, m.value);
            return { type, value: m.value };
        });
        return this.collapseLiterals(parts);
    }
    collapseLiterals(parts) {
        for (let i = 0; i < parts.length; i++) {
            const current = parts[i];
            if (current.type === "literal") {
                let position = i + 1;
                while (true) {
                    const next = parts[position];
                    if (!(next && next.type === "literal"))
                        break;
                    current.value = current.value + next.value;
                    parts.splice(position, 1);
                }
            }
        }
        return parts;
    }
    getType(type, value) {
        if (type === 'month' || type === 'weekday') {
            if (this.parsable(this.months, value))
                return "month";
            if (this.parsable(this.weekdays, value))
                return "weekday";
            return 'literal';
        }
        return type;
    }
    parsable(lookup, value) {
        try {
            return Boolean(lookup.parse(value));
        }
        catch (e) {
            return false;
        }
    }
}
(0, tslib_1.__decorate)([
    lazy_1.lazy
], DateParts.prototype, "formatter", null);
(0, tslib_1.__decorate)([
    lazy_1.lazy
], DateParts.prototype, "formatted", null);
(0, tslib_1.__decorate)([
    lazy_1.lazy
], DateParts.prototype, "months", null);
(0, tslib_1.__decorate)([
    lazy_1.lazy
], DateParts.prototype, "month", null);
(0, tslib_1.__decorate)([
    lazy_1.lazy
], DateParts.prototype, "weekdays", null);
(0, tslib_1.__decorate)([
    lazy_1.lazy
], DateParts.prototype, "weekday", null);
(0, tslib_1.__decorate)([
    lazy_1.lazy
], DateParts.prototype, "year", null);
(0, tslib_1.__decorate)([
    lazy_1.lazy
], DateParts.prototype, "day", null);
(0, tslib_1.__decorate)([
    lazy_1.lazy
], DateParts.prototype, "learningNamesPattern", null);
(0, tslib_1.__decorate)([
    lazy_1.lazy
], DateParts.prototype, "actualNamesPattern", null);
(0, tslib_1.__decorate)([
    cache_1.cache
], DateParts, "create", null);
exports.DateParts = DateParts;
//# sourceMappingURL=formatting.js.map