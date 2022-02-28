"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FromFormatStringWeekdayExtractor = exports.FromFormatStringMonthExtractor = exports.FromFormatStringDataExtractor = exports.NativeDataExtractor = exports.valueFromParts = exports.BaseDataExtractor = exports.exactFormat = exports.weekdays = exports.Weekdays = exports.months = exports.Months = void 0;
const arrays_1 = require("../arrays");
const core_1 = require("./core");
const formatting_1 = require("./formatting");
const characters_1 = require("../characters");
const parsing_1 = require("../parsing");
const functions_1 = require("../functions");
class Months extends parsing_1.DatumLookup {
    constructor(data, locale) {
        super(data);
        this.numerals = parsing_1.Numerals.get(locale);
    }
    parse(value) {
        const number = (0, functions_1.get)(() => this.numerals.parse(value));
        return isNaN(number) ? super.parse((0, parsing_1.cleanValue)(value)) : number;
    }
    static get(locale, additionalData = []) {
        return Months.cache[locale] = Months.cache[locale] || Months.create(locale, additionalData);
    }
    static set(locale, months) {
        return Months.cache[locale] = months;
    }
    static create(locale, additionalData = []) {
        return new Months([...Months.generateData(locale), ...additionalData], locale);
    }
    static generateData(locale) {
        return (0, arrays_1.flatten)(Months.formats.map(f => Months.dataFor(locale, f)));
    }
    static dataFor(locale, options, native = formatting_1.hasNativeToParts) {
        return months(locale, options, native).map((m, i) => ({ name: m, value: i + 1 }));
    }
}
exports.Months = Months;
Months.formats = [
    { month: "long" }, { month: "short" },
    { year: 'numeric', month: "long", day: 'numeric' },
    { year: 'numeric', month: 'short', day: 'numeric' },
];
Months.cache = {};
// No dep version
function range(start, end) {
    const result = [];
    for (let i = start; i <= end; i++) {
        result.push(i);
    }
    return result;
}
const months_cache = {};
function months(locale, monthFormat = 'long', native = formatting_1.hasNativeToParts) {
    const key = JSON.stringify({ locale, monthFormat, native });
    return months_cache[key] = months_cache[key] || (() => {
        const options = Object.assign({}, typeof monthFormat == 'string' ? { month: monthFormat } : monthFormat);
        if (!options.month)
            return [];
        const dates = range(1, 12).map(i => (0, core_1.date)(2000, i, 1));
        if (native)
            return new NativeDataExtractor(locale, options, dates, 'month').extract().map(parsing_1.cleanValue);
        return new FromFormatStringMonthExtractor(locale, options, dates).extract().map(parsing_1.cleanValue);
    })();
}
exports.months = months;
class Weekdays extends parsing_1.DatumLookup {
    parse(value) {
        return super.parse((0, parsing_1.cleanValue)(value));
    }
    static get(locale, additionalData = []) {
        return Weekdays.cache[locale] = Weekdays.cache[locale] || Weekdays.create(locale, additionalData);
    }
    static set(locale, weekdays) {
        return Weekdays.cache[locale] = weekdays;
    }
    static create(locale, additionalData = []) {
        return new Weekdays([...Weekdays.generateData(locale), ...additionalData]);
    }
    static generateData(locale) {
        return (0, arrays_1.flatten)(Weekdays.formats.map(f => Weekdays.dataFor(locale, f)));
    }
    static dataFor(locale, options, native = formatting_1.hasNativeToParts) {
        return weekdays(locale, options, native).map((m, i) => ({ name: m, value: i + 1 }));
    }
}
exports.Weekdays = Weekdays;
Weekdays.formats = [
    { weekday: "long" }, { weekday: "short" },
    { year: 'numeric', month: "numeric", day: 'numeric', weekday: 'long' },
    { year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short' }
];
Weekdays.cache = {};
const weekdays_cache = {};
function weekdays(locale, weekdayFormat = 'long', native = formatting_1.hasNativeToParts) {
    const key = JSON.stringify({ locale, weekdayFormat, native });
    return weekdays_cache[key] = weekdays_cache[key] || (() => {
        const options = Object.assign({}, typeof weekdayFormat == 'string' ? { weekday: weekdayFormat } : weekdayFormat);
        if (!options.weekday)
            return [];
        const dates = range(1, 7).map(i => (0, core_1.date)(2000, 1, i + 2));
        if (native)
            return new NativeDataExtractor(locale, options, dates, 'weekday').extract().map(parsing_1.cleanValue);
        return new FromFormatStringWeekdayExtractor(locale, options, dates).extract().map(parsing_1.cleanValue);
    })();
}
exports.weekdays = weekdays;
function exactFormat(locale, options, dates) {
    const formatter = formatting_1.Formatters.create(locale, options);
    return dates.map(d => formatter.format(d));
}
exports.exactFormat = exactFormat;
class BaseDataExtractor {
    constructor(locale, options, dates, partType) {
        this.locale = locale;
        this.options = options;
        this.dates = dates;
        this.partType = partType;
    }
}
exports.BaseDataExtractor = BaseDataExtractor;
function valueFromParts(parts, partType) {
    return parts.filter(p => p.type === partType).map(p => p.value).join('');
}
exports.valueFromParts = valueFromParts;
class NativeDataExtractor extends BaseDataExtractor {
    extract() {
        const formatter = formatting_1.Formatters.create(this.locale, this.options);
        return this.dates.map(d => valueFromParts(formatter.formatToParts(d), this.partType));
    }
}
exports.NativeDataExtractor = NativeDataExtractor;
class FromFormatStringDataExtractor extends BaseDataExtractor {
    extract() {
        const exact = Object.keys(this.options).length == 1;
        const fullFormats = exactFormat(this.locale, this.options, this.dates);
        if (exact)
            return fullFormats;
        const simpleFormats = exactFormat(this.locale, { [this.partType]: this.options[this.partType] }, this.dates);
        const diffs = this.diff(fullFormats);
        const result = [];
        for (let i = 0; i < simpleFormats.length; i++) {
            const full = fullFormats[i];
            const simple = simpleFormats[i];
            const diff = diffs[i];
            result.push(full.indexOf(simple) != -1 && simple.length > diff.length && isNaN(parseInt(diff)) ? simple : diff);
        }
        return result;
    }
    diff(data) {
        return (0, characters_1.different)(data);
    }
}
exports.FromFormatStringDataExtractor = FromFormatStringDataExtractor;
class FromFormatStringMonthExtractor extends FromFormatStringDataExtractor {
    constructor(locale, options, dates) {
        super(locale, options, dates, 'month');
    }
    diff(data) {
        if (!this.options.weekday)
            return super.diff(data);
        const result = [];
        const days = weekdays(this.locale, this.options, false);
        const weekday = days[this.day(this.dates[8])];
        for (let i = 0; i < data.length; i++) {
            // the characters for year,month,day are also the same for Saturday,Sunday,Monday so we temp replace them
            const format = this.replaceYearMonthDay(data[i]);
            // then make all the weekdays the same so only the months are different
            const replaced = format.replace(this.weekday(days, i), weekday);
            // then restore the original year month day symbols afterwards
            result[i] = this.restoreYearMonthDay(replaced);
        }
        return super.diff(result);
    }
    weekday(days, i) {
        return days[this.day(this.dates[i])];
    }
    replaceYearMonthDay(value) {
        return (0, characters_1.replace)(FromFormatStringMonthExtractor.replaceYMD, value, matcher => {
            const number = matcher[1];
            const delimiter = matcher[2];
            if (delimiter === '年')
                return `${number}year`;
            if (delimiter === '月')
                return `${number}month`;
            if (delimiter === '日')
                return `${number}day`;
            throw new Error(`Unknown delimiter ${delimiter}`);
        });
    }
    restoreYearMonthDay(value) {
        return (0, characters_1.replace)(FromFormatStringMonthExtractor.restoreYMD, value, matcher => {
            const delimiter = matcher[1];
            if (delimiter === 'year')
                return '年';
            if (delimiter === 'month')
                return '月';
            if (delimiter === 'day')
                return '日';
            throw new Error(`Unknown delimiter ${delimiter}`);
        });
    }
    day(date) {
        const day = date.getUTCDay();
        if (day == 0)
            return 6;
        return day - 1;
    }
}
exports.FromFormatStringMonthExtractor = FromFormatStringMonthExtractor;
FromFormatStringMonthExtractor.replaceYMD = /(\d)([年月日])/g;
FromFormatStringMonthExtractor.restoreYMD = /(year|month|day)/g;
class FromFormatStringWeekdayExtractor extends FromFormatStringDataExtractor {
    constructor(locale, options, dates) {
        super(locale, options, dates, 'weekday');
    }
    diff(data) {
        if (!this.options.day)
            return super.diff(data);
        const result = [];
        const day = this.dates[0].getUTCDate().toString();
        for (let i = 0; i < data.length; i++) {
            const f = data[i];
            const d = this.convertToNumeral(this.dates[i].getUTCDate());
            const r = f.replace(d, day);
            result[i] = r;
        }
        return super.diff(result);
    }
    convertToNumeral(number) {
        return (0, parsing_1.numberFormatter)(this.locale).format(number);
    }
}
exports.FromFormatStringWeekdayExtractor = FromFormatStringWeekdayExtractor;
//# sourceMappingURL=datum.js.map