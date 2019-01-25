import {date, Datum, DatumLookup, defaultOptions, Months, Options, Weekdays} from "./index";
import {lazy} from "../lazy";
import {namedGroups, NamedGroups, replace} from "../characters";
import DateTimeFormatPart = Intl.DateTimeFormatPart;
import DateTimeFormat = Intl.DateTimeFormat;
import {unique} from "../arrays";
import DateTimeFormatPartTypes = Intl.DateTimeFormatPartTypes;

export class Formatters {
    static cache: { [key: string]: Intl.DateTimeFormat } = {};

    static create(locale: string = 'default', options: Options = defaultOptions) {
        const key = JSON.stringify({locale, options});
        return Formatters.cache[key] = Formatters.cache[key] || (() => {
            // Detect IE 11 bug
            const clone = {...options};
            const keys = Object.keys(clone).length;
            const formatter = new Intl.DateTimeFormat(locale, clone);
            if(Object.keys(clone).length != keys) throw new Error(`Unsupported DateTimeFormat options provided: ${JSON.stringify(options)}`);
            return formatter;
        })();
    }
}

export function format(value: Date, locale?: string, options: Options = defaultOptions): string {
    return Formatters.create(locale, options).format(value);
}

export const hasNativeFormatToParts = false; //typeof Intl.DateTimeFormat.prototype.formatToParts == 'function';

export function formatData(value: Date, locale: string = 'default', options: Options = defaultOptions): DateTimeFormatPart[] {
    const formatter = Formatters.create(locale, options);
    if(hasNativeFormatToParts) return formatter.formatToParts(value);
    return FormatToParts.create(locale, options).formatToParts(value);
}

export class FormatToParts {
    private constructor(private locale: string,
                        private options: Options = defaultOptions,
                        private year = 3333,
                        private monthValue = 11,
                        private day = 22,
                        private weekdayValue = 7 /*Sunday*/) {
    }

    static cache: { [key: string]: FormatToParts } = {};

    static create(locale: string, options: Options = defaultOptions): FormatToParts {
        const key = JSON.stringify({locale, options});
        return FormatToParts.cache[key] = FormatToParts.cache[key] || new FormatToParts(locale, options);
    }

    @lazy get formatter(): DateTimeFormat {
        return Formatters.create(this.locale, this.options);
    }

    @lazy get formatted(): string {
        return this.formatter.format(date(this.year, this.monthValue, this.day));
    }

    @lazy get months(): Months {
        return Months.get(this.locale, Months.dataFor(this.locale, this.options));
    }

    @lazy get monthOrWeekday(): string {
        const all = unique([...this.months.characters, ...this.weekdays.characters]).join('');
        return `[${all}]+`;
    }

    @lazy get weekdays(): Weekdays {
        return Weekdays.get(this.locale, Weekdays.dataFor(this.locale, this.options));
    }

    @lazy get learningNamesPattern(): NamedGroups {
        if(!this.months.get(1).name) throw new Error("Unable to detect months");
        if(!this.weekdays.get(1).name) throw new Error("Unable to detect weekday");
        const template = (key:string) => `(?<${key}>${(this as any)[key]})`;
        const patterns = [];
        if(this.options.year) patterns.push(template('year'));
        if(this.options.month || this.options.weekday) patterns.push(template('monthOrWeekday'));
        if(this.options.day) patterns.push(template('day'));
        const namedPattern = `(?:${patterns.join("|")})`;
        return namedGroups(namedPattern);
    }

    @lazy get actualNamesPattern():NamedGroups {
        const {names: learningNames, pattern: learningPattern} = this.learningNamesPattern;
        const learningRegex = new RegExp(learningPattern, 'g');

        const result: string[] = [];
        let count = 0;
        const literalHandler = (value:string) => {
            if(value) {
                result.push(`(?<literal-${count++}>[${value}]+?)`);
            }
        };
        replace(learningRegex, this.formatted, match => {
            const [type] = Object.keys(learningNames).map(k => match[learningNames[k]] ? k : undefined).filter(Boolean);
            if(!type) throw new Error();
            const value = match[learningNames[type]];

            if(type == 'year') result.push('(?<year>\\d{4})');
            if(type == "day") result.push( '(?<day>\\d{1,2})');
            if(type == "monthOrWeekday") {
                const parsed = [this.months, this.weekdays].filter(s => this.parsable(s, value));
                if(parsed.length){
                    result.push( `(?<monthOrWeekday-${count++}>${this.monthOrWeekday})`);
                } else {
                    literalHandler(value);
                }
            }
            return "";
        }, value => {
            literalHandler(value);
            return "";
        });

        return namedGroups("^" + result.join("") + "$");
    }

    formatToParts(date: Date): DateTimeFormatPart[] {
        const {names, pattern} = this.actualNamesPattern;

        const actualResult = this.formatter.format(date);
        const regex = new RegExp(pattern);

        const parts: DateTimeFormatPart[] = [];
        const match = actualResult.match(regex);
        if(!match) {
            throw new Error(`${pattern} did not match ${actualResult}` );
        }
        Object.entries(names).map(([type, index]) => {
            let value = match[index];
            type = this.getType(type, value);
            parts.push({type: (type as any), value});
        });

        return this.collapseLiterals(parts);
    }

    private collapseLiterals(parts: DateTimeFormatPart[]): DateTimeFormatPart[] {
        for (let i = 0; i < parts.length; i++) {
            const current = parts[i];
            if(current.type === "literal") {
                let position = i + 1;
                while(true){
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
        type = type.split('-')[0];
        if(type === 'monthOrWeekday') {
            if(this.parsable(this.months, value)) return "month";
            if(this.parsable(this.weekdays, value)) return "weekday";
            throw new Error("Unable to parse value: " + value);
        }
        return type as any;
    }

    private parsable(lookup: DatumLookup, value:string){
        try {
            return Boolean(lookup.parse(value));
        } catch (e) {
            return false;
        }
    }
}