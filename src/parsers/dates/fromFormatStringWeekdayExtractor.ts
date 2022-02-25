import {FromFormatStringDataExtractor} from "./fromFormatStringDataExtractor";
import {Options} from "./core";
import {numberFormatter} from "../numerals";

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