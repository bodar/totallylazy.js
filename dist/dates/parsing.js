"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.localeParser = exports.simpleParser = exports.parser = exports.defaultParserOptions = exports.formatBuilder = exports.optionsFrom = exports.partsFrom = exports.formatRegex = exports.formatFrom = exports.Days = exports.SmartDate = exports.Pivot = exports.InferYear = exports.InferDirection = exports.InferYearViaWeekday = exports.compositeDateFactory = exports.DefaultDateFactory = exports.dateFrom = exports.DateTimeFormatPartParser = exports.DateParser = exports.escapeCharacters = exports.RegexBuilder = exports.parse = void 0;
const tslib_1 = require("tslib");
const lazy_1 = require("../lazy");
const arrays_1 = require("../arrays");
const characters_1 = require("../characters");
const index_1 = require("./index");
const parsing_1 = require("../parsing");
const collections_1 = require("../collections");
const transducers_1 = require("../transducers");
const cache_1 = require("../cache");
const functions_1 = require("../functions");
const clock_1 = require("./clock");
const sequence_1 = require("../sequence");
function parse(value, locale, options, native = index_1.hasNativeToParts) {
    return parser(locale, options, native).parse(value);
}
exports.parse = parse;
class RegexBuilder {
    constructor(locale, options = index_1.defaultOptions, formatted) {
        this.locale = locale;
        this.options = options;
        this.formatted = formatted;
    }
    static create(locale, options = index_1.defaultOptions, native = index_1.hasNativeToParts) {
        if (typeof options == 'string')
            return formatBuilder(locale, options);
        if (typeof options.format == 'string')
            return formatBuilder(locale, options.format, options.strict);
        return new RegexBuilder(locale, options, (0, index_1.formatData)(new Date(), locale, options, native));
    }
    get pattern() {
        const pattern = this.formatted.map((part, index) => {
            switch (part.type) {
                case "year":
                    return `(?<year>[${(0, parsing_1.digits)(this.locale)}]{${this.lengthOf(part.value)}})`;
                case "month":
                    return `(?<month>${this.monthsPattern()})`;
                case "day":
                    return `(?<day>[${(0, parsing_1.digits)(this.locale)}]{1,2})`;
                case "weekday":
                    return `(?<weekday>${index_1.Weekdays.get(this.locale).pattern.toLocaleLowerCase(this.locale)})`;
                default: {
                    const chars = (0, arrays_1.unique)((0, characters_1.characters)(escapeCharacters(this.addExtraLiterals(part)))).join('').replace(' ', '\\s');
                    const isLast = index === this.formatted.length - 1;
                    const quantifier = isLast ? '*' : '+';
                    return `[${chars}]${quantifier}?`;
                }
            }
        }).join("");
        return (0, parsing_1.atBoundaryOnly)(pattern);
    }
    lengthOf(year) {
        if (year.length === 2)
            return 2;
        if (year === '2-digit')
            return 2;
        return 4;
    }
    addExtraLiterals(part) {
        if (this.options.strict)
            return part.value;
        if (this.options.format)
            return part.value + (this.options.separators || parsing_1.boundaryDelimiters);
        return part.value + (this.options.separators || (parsing_1.boundaryDelimiters + parsing_1.extraDelimiters));
    }
    monthsPattern() {
        const numericPattern = `[${(0, parsing_1.digits)(this.locale)}]{1,2}`;
        const textPattern = index_1.Months.get(this.locale).pattern.toLocaleLowerCase(this.locale);
        if (this.options.month === "2-digit" || this.options.month === "numeric")
            return numericPattern;
        if (this.options.month === "short" || this.options.month === "long")
            return textPattern;
        return `(?:${numericPattern}|${textPattern})`;
    }
}
(0, tslib_1.__decorate)([
    lazy_1.lazy
], RegexBuilder.prototype, "pattern", null);
(0, tslib_1.__decorate)([
    cache_1.cache
], RegexBuilder, "create", null);
exports.RegexBuilder = RegexBuilder;
function escapeCharacters(value) {
    return value.replace(/[\-]/g, '\\$&');
}
exports.escapeCharacters = escapeCharacters;
class DateParser {
    static create(locale, options = index_1.defaultOptions, native = index_1.hasNativeToParts) {
        const pattern = RegexBuilder.create(locale, options, native).pattern;
        return (0, parsing_1.mappingParser)(DateTimeFormatPartParser.create(characters_1.NamedRegExp.create(pattern), locale), p => dateFrom(p, locale, typeof options === "object" ? options.factory : undefined));
    }
}
(0, tslib_1.__decorate)([
    cache_1.cache
], DateParser, "create", null);
exports.DateParser = DateParser;
class DateTimeFormatPartParser {
    static create(regex, locale) {
        return (0, parsing_1.preProcess)((0, parsing_1.mappingParser)((0, parsing_1.namedRegexParser)(regex), m => this.convert(m, locale)), value => this.preProcess(value, locale));
    }
    static convert(matches, locale) {
        return matches.map((m) => ({
            type: m.name,
            value: m.value.toLocaleUpperCase(locale)
        }));
    }
    static preProcess(value, locale) {
        return value.toLocaleLowerCase(locale);
    }
}
(0, tslib_1.__decorate)([
    cache_1.cache
], DateTimeFormatPartParser, "create", null);
exports.DateTimeFormatPartParser = DateTimeFormatPartParser;
function dateFrom(parts, locale, factory = new DefaultDateFactory()) {
    const parser = (0, parsing_1.numberParser)('.', locale);
    const dayText = parts.find(p => p.type === 'day');
    if (!dayText)
        throw new Error("No day found");
    const day = parser.parse(dayText.value);
    const monthText = parts.find(p => p.type === 'month');
    if (!monthText)
        throw new Error("No month found");
    const month = index_1.Months.get(locale).parse(monthText.value);
    const yearText = parts.find(p => p.type === 'year');
    const year = yearText ? parser.parse(yearText.value) : undefined;
    const weekdayText = parts.find(p => p.type === 'weekday');
    const weekday = weekdayText ? (0, functions_1.get)(() => index_1.Weekdays.get(locale).parse(weekdayText.value)) : undefined;
    return factory.create({ year, month, day, weekday });
}
exports.dateFrom = dateFrom;
class DefaultDateFactory {
    create({ year, month, day }) {
        if (typeof year === "undefined")
            throw new Error("No year found");
        return (0, index_1.date)(year, month, day);
    }
}
exports.DefaultDateFactory = DefaultDateFactory;
class CompositeDateFactory {
    constructor(factories) {
        this.factories = factories;
    }
    create(parts) {
        for (const factory of this.factories) {
            try {
                return factory.create(parts);
            }
            catch (e) {
            }
        }
        throw new Error(`Unable to create date for ${JSON.stringify(parts)}`);
    }
}
function compositeDateFactory(...factories) {
    return new CompositeDateFactory(factories);
}
exports.compositeDateFactory = compositeDateFactory;
class InferYearViaWeekday {
    constructor(clock) {
        this.clock = clock;
    }
    static create(clock = new clock_1.SystemClock()) {
        return new InferYearViaWeekday(clock);
    }
    create({ year, month, day, weekday }) {
        if (year)
            return (0, index_1.date)(year, month, day);
        if (!weekday)
            throw new Error('No weekday provided');
        const candidate = this.candidates(month, day).find(c => (0, index_1.weekdayOf)(c) === weekday);
        if (candidate)
            return candidate;
        throw new Error('No candidate date found that matches');
    }
    // Dates repeat every 5,6 or 11 years so we choose a 12 year range
    // Then start with today's date (0) and alternate between the future (+1) and the past (-1)
    candidates(month, day) {
        const now = Days.startOf(this.clock.now());
        return (0, collections_1.array)((0, sequence_1.range)(0, -6), (0, transducers_1.zip)((0, sequence_1.range)(1, 6)), (0, transducers_1.flatMap)(a => a), (0, parsing_1.mapIgnoreError)(inc => (0, index_1.date)((0, index_1.yearOf)(now) + inc, month, day)));
    }
}
exports.InferYearViaWeekday = InferYearViaWeekday;
var InferDirection;
(function (InferDirection) {
    InferDirection[InferDirection["Before"] = -1] = "Before";
    InferDirection[InferDirection["After"] = 1] = "After";
})(InferDirection = exports.InferDirection || (exports.InferDirection = {}));
class InferYear {
    constructor(date, direction) {
        this.direction = direction;
        this.date = Days.startOf(date);
    }
    static before(date) {
        return new InferYear(date, InferDirection.Before);
    }
    static after(date) {
        return new InferYear(date, InferDirection.After);
    }
    static sliding(clock = new clock_1.SystemClock()) {
        const now = clock.now();
        return InferYear.before((0, index_1.date)((0, index_1.yearOf)(now) + 50, 1, 1));
    }
    create({ year, month, day }) {
        if (year && year < 10)
            throw new Error('Illegal year');
        if (year && year >= 100 && year < 1000)
            throw new Error('Illegal year');
        if (year && year >= 1000)
            return (0, index_1.date)(year, month, day);
        const calculatedYear = this.calculateYear(year);
        const candidate = (0, index_1.date)(calculatedYear, month, day);
        if (this.direction == InferDirection.Before && candidate < this.date)
            return candidate;
        if (this.direction == InferDirection.After && candidate > this.date)
            return candidate;
        const yearIncrement = this.calculateYearIncrement(year);
        candidate.setUTCFullYear(candidate.getUTCFullYear() + (yearIncrement * this.direction));
        return candidate;
    }
    calculateYearIncrement(year) {
        return typeof year === 'undefined' ? 1 : 100;
    }
    calculateYear(year) {
        if (typeof year === 'undefined')
            return this.date.getUTCFullYear();
        const century = Math.floor(this.date.getUTCFullYear() / 100) * 100;
        return year + century;
    }
}
exports.InferYear = InferYear;
class Pivot {
    /***
     * @deprecated Please use InferYear.before
     */
    static on(pivotYear) {
        return InferYear.before((0, index_1.date)(pivotYear, 1, 1));
    }
    /***
     * @deprecated Please use InferYear.sliding
     */
    static sliding(clock = new clock_1.SystemClock()) {
        return InferYear.sliding(clock);
    }
}
exports.Pivot = Pivot;
/***
 * @deprecated Please use InferYear
 */
class SmartDate {
    constructor(clock = new clock_1.SystemClock()) {
        this.clock = clock;
    }
    create(parts) {
        if (typeof parts.year === "undefined") {
            return InferYear.after(this.clock.now()).create(parts);
        }
        return InferYear.sliding(this.clock).create(parts);
    }
}
exports.SmartDate = SmartDate;
class Days {
    static startOf(value) {
        return (0, index_1.date)((0, index_1.yearOf)(value), (0, index_1.monthOf)(value), (0, index_1.dayOf)(value));
    }
    static add(date, days) {
        const newDate = new Date(date.getTime());
        newDate.setUTCDate(date.getUTCDate() + days);
        return newDate;
    }
    static subtract(date, days) {
        return Days.add(date, days * -1);
    }
    static between(a, b) {
        return Math.abs((a.getTime() - b.getTime()) / Days.milliseconds);
    }
}
exports.Days = Days;
Days.milliseconds = 24 * 60 * 60 * 1000;
function formatFrom(type, length) {
    if (type === 'year') {
        if (length === 4)
            return "numeric";
        if (length === 2)
            return "2-digit";
    }
    if (type === 'month') {
        if (length === 4)
            return "long";
        if (length === 3)
            return "short";
        if (length === 2)
            return "2-digit";
        if (length === 1)
            return "numeric";
    }
    if (type === 'day') {
        if (length === 2)
            return "2-digit";
        if (length === 1)
            return "numeric";
    }
    if (type === 'weekday') {
        if (length === 4)
            return "long";
        if (length === 3)
            return "short";
    }
    throw new Error(`Illegal Argument: ${type} ${length}`);
}
exports.formatFrom = formatFrom;
exports.formatRegex = characters_1.NamedRegExp.create('(?:(?<year>y+)|(?<month>M+)|(?<day>d+)|(?<weekday>E+))', 'g');
function partsFrom(format) {
    return (0, collections_1.array)(exports.formatRegex.iterate(format), (0, transducers_1.map)(matchOrNot => {
        if ((0, characters_1.isNamedMatch)(matchOrNot)) {
            const [match] = matchOrNot.filter(m => Boolean(m.value));
            const type = match.name;
            const value = formatFrom(type, match.value.length);
            return { type, value };
        }
        else {
            return { type: "literal", value: matchOrNot };
        }
    }));
}
exports.partsFrom = partsFrom;
function optionsFrom(formatOrParts) {
    const parts = typeof formatOrParts === "string" ? partsFrom(formatOrParts) : formatOrParts;
    const keys = ['year', 'month', 'day', 'weekday'];
    return parts.filter(p => keys.indexOf(p.type) != -1).reduce((a, p) => {
        a[p.type] = p.value;
        return a;
    }, typeof formatOrParts === "string" ? { format: formatOrParts } : {});
}
exports.optionsFrom = optionsFrom;
function formatBuilder(locale, format, strict = false) {
    return new RegexBuilder(locale, Object.assign(Object.assign({}, optionsFrom(format)), { strict }), partsFrom(format));
}
exports.formatBuilder = formatBuilder;
exports.defaultParserOptions = [
    { year: 'numeric', month: 'long', day: 'numeric', weekday: "long" },
    { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' },
    { year: 'numeric', month: 'numeric', day: 'numeric' },
    { year: 'numeric', month: 'short', day: 'numeric' },
    { year: 'numeric', month: 'long', day: 'numeric' }
];
function parser(locale, options, native = index_1.hasNativeToParts) {
    if (typeof options == 'string') {
        return simpleParser(locale, options, native);
    }
    else {
        return localeParser(locale, options, native);
    }
}
exports.parser = parser;
function simpleParser(locale, format, native = index_1.hasNativeToParts) {
    return DateParser.create(locale, format, native);
}
exports.simpleParser = simpleParser;
function localeParser(locale, options, native = index_1.hasNativeToParts) {
    if (!options) {
        return (0, parsing_1.or)(...exports.defaultParserOptions.map(o => localeParser(locale, o, native)));
    }
    return DateParser.create(locale, options, native);
}
exports.localeParser = localeParser;
//# sourceMappingURL=parsing.js.map