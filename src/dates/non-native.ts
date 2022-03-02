import {date, defaultOptions, Month, Options, PatternParser, Weekday} from "./core";
import {different, isNamedMatch, NamedRegExp, replace} from "../characters";
import {Weekdays} from "./formatting";
import {cache} from "../cache";
import {lazy} from "../lazy";
import {DateFormatter, Formatters, StringDateFormatter} from "./format";
import {array} from "../array";
import {map} from "../transducers";
import {numberFormatter, Numerals} from "./datum";
import {BaseDataExtractor, DataExtractor, weekdays} from "./extractors";
import {MonthsBuilder} from "./generators";
import DateTimeFormatPart = Intl.DateTimeFormatPart;
import DateTimeFormatPartTypes = Intl.DateTimeFormatPartTypes;

export function exactFormat(locale: string, options: Options, dates: Date[]): string[] {
    const formatter = Formatters.create(locale, options);
    return dates.map(d => formatter.format(d));
}

export abstract class FromFormatStringDataExtractor extends BaseDataExtractor implements DataExtractor {
    extract(): string[] {
        const exact = Object.keys(this.options).length == 1;
        const fullFormats = exactFormat(this.locale, this.options, this.dates);
        if (exact) return fullFormats;
        const simpleFormats = exactFormat(this.locale, {[this.partType]: (this.options as any)[this.partType]} as any, this.dates);
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

    diff(data: string[]): string[] {
        return different(data);
    }
}

export class FromFormatStringMonthExtractor extends FromFormatStringDataExtractor {
    constructor(locale: string, options: Options, dates: Date[]) {
        super(locale, options, dates, 'month');
    }

    diff(data: string[]): string[] {
        if (!this.options.weekday) return super.diff(data);
        const result: string[] = [];
        const days = weekdays(this.locale, this.options);
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

    private weekday(days: string[], i: number) {
        return days[this.day(this.dates[i])];
    }

    static readonly replaceYMD = /(\d)([年月日])/g;

    private replaceYearMonthDay(value: string) {
        return replace(FromFormatStringMonthExtractor.replaceYMD, value, matcher => {
            const number = matcher[1];
            const delimiter = matcher[2];
            if (delimiter === '年') return `${number}year`;
            if (delimiter === '月') return `${number}month`;
            if (delimiter === '日') return `${number}day`;
            throw new Error(`Unknown delimiter ${delimiter}`)
        });
    }

    static readonly restoreYMD = /(year|month|day)/g;

    private restoreYearMonthDay(value: string) {
        return replace(FromFormatStringMonthExtractor.restoreYMD, value, matcher => {
            const delimiter = matcher[1];
            if (delimiter === 'year') return '年';
            if (delimiter === 'month') return '月';
            if (delimiter === 'day') return '日';
            throw new Error(`Unknown delimiter ${delimiter}`)
        });
    }

    private day(date: Date): number {
        const day = date.getUTCDay();
        if (day == 0) return 6;
        return day - 1;
    }
}

export class FromFormatStringWeekdayExtractor extends FromFormatStringDataExtractor {
    constructor(locale: string, options: Options, dates: Date[]) {
        super(locale, options, dates, 'weekday');
    }

    diff(data: string[]): string[] {
        if (!this.options.day) return super.diff(data);
        const result: string[] = [];
        const day = this.dates[0].getUTCDate().toString();
        for (let i = 0; i < data.length; i++) {
            const f = data[i];
            const d = this.convertToNumeral(this.dates[i].getUTCDate());
            const r = f.replace(d, day);
            result[i] = r;
        }
        return super.diff(result);
    }

    private convertToNumeral(number: number): string {
        return numberFormatter(this.locale).format(number);
    }
}

export class LearningDateFormatter implements DateFormatter {
    private constructor(private locale: string,
                        private options: Options = defaultOptions,
                        private yearValue = 3333,
                        private monthValue = 11,
                        private dayValue = 20,
                        private weekdayValue = Weekday.Friday,
                        private numerals = Numerals.get(locale)) {
    }

    @cache
    static create(locale: string, options: Options = defaultOptions): LearningDateFormatter {
        return new LearningDateFormatter(locale, options);
    }

    @lazy get formatter(): StringDateFormatter {
        return Formatters.create(this.locale, this.options);
    }

    @lazy get formatted(): string {
        return this.formatter.format(date(this.yearValue, this.monthValue, this.dayValue));
    }

    @lazy get months(): PatternParser<Month> {
        return MonthsBuilder.create(this.options).build(this.locale);
    }

    @lazy get month(): string {
        return MonthsBuilder.create(this.options).namesFor(this.locale, this.options)[this.monthValue - 1];
    }

    @lazy get weekdays(): Weekdays {
        return new Weekdays(Weekdays.dataFor(this.locale, this.options));
    }

    @lazy get weekday(): string {
        return weekdays(this.locale, this.options)[this.weekdayValue - 1];
    }

    @lazy get year(): string {
        return this.numerals.format(this.yearValue);
    }

    @lazy get day(): string {
        return this.numerals.format(this.dayValue);
    }

    @lazy get learningNamesPattern(): NamedRegExp {
        const template = (key: string) => `(?<${key}>${(this as any)[key]})`;
        const patterns = Object.keys(this.options).map(k => template(k));
        const namedPattern = `(?:${patterns.join("|")})`;
        return NamedRegExp.create(namedPattern);
    }

    @lazy get actualNamesPattern(): NamedRegExp {
        const numbers = Numerals.get(this.locale).pattern;
        const learningRegex = this.learningNamesPattern;

        const result = array(learningRegex.iterate(this.formatted), map(value => {
            if (isNamedMatch(value)) {
                let [type] = value.filter(n => Boolean(n.value)).map(n => n.name);
                if (!type) throw new Error();
                if (type == 'year') return `(?<year>[${numbers}]{4})`;
                else if (type == "day") return `(?<day>[${numbers}]{1,2})`;
                else if (type == "month") return `(?<month>(?:[${numbers}]{1,2}|${this.months.pattern}))`;
                else if (type == "weekday") return `(?<weekday>${this.weekdays.pattern})`;
            } else {
                return `(?<literal>[${value}]+?)`;
            }
        }));

        const pattern = "^" + result.join("") + "$";
        return NamedRegExp.create(pattern);
    }

    format(date: Date): string {
        return this.formatter.format(date);
    }

    formatToParts(date: Date): DateTimeFormatPart[] {
        const regex = this.actualNamesPattern;
        const actualResult = this.formatter.format(date);

        const match = regex.match(actualResult);
        if (match.length === 0) {
            throw new Error(`${regex} did not match ${actualResult}`);
        }

        const parts = match.map(m => {
            const type = this.getType(m.name, m.value);
            return {type, value: m.value};
        });

        return this.collapseLiterals(parts);
    }

    private collapseLiterals(parts: DateTimeFormatPart[]): DateTimeFormatPart[] {
        for (let i = 0; i < parts.length; i++) {
            const current = parts[i];
            if (current.type === "literal") {
                let position = i + 1;
                while (true) {
                    const next = parts[position];
                    if (!(next && next.type === "literal")) break;
                    current.value = current.value + next.value;
                    parts.splice(position, 1);
                }
            }
        }
        return parts;
    }

    private getType(type: string, value: string): DateTimeFormatPartTypes {
        if (type === 'month' || type === 'weekday') {
            if (this.parsable(this.months, value)) return "month";
            if (this.parsable(this.weekdays, value)) return "weekday";
            return 'literal';
        }
        return type as any;
    }

    private parsable(lookup: PatternParser<any>, value: string) {
        try {
            return Boolean(lookup.parse(value));
        } catch (e) {
            return false;
        }
    }
}