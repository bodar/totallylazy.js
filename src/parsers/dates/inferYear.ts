import {DateFactory, DateFactoryParts} from "./core";
import {Clock, SystemClock} from "../../clock";
import {date, Month, weekdayOf, yearOf} from "../../dates";
import {Days} from "./Days";
import {array} from "../../array";
import {range} from "../../sequence";
import {flatMap, zip} from "../../transducers";
import {mapIgnoreError} from "../parsing";

export class InferYearViaWeekday implements DateFactory {
    private constructor(private clock: Clock) {
    }

    static create(clock: Clock = new SystemClock()): DateFactory {
        return new InferYearViaWeekday(clock);
    }

    create({year, month, day, weekday}: DateFactoryParts): Date {
        if (year) return date(year, month, day);
        if (!weekday) throw new Error('No weekday provided');
        const candidate = this.candidates(month, day).find(c => weekdayOf(c) === weekday);
        if (candidate) return candidate;
        throw new Error('No candidate date found that matches');
    }

    // Dates repeat every 5,6 or 11 years so we choose a 12 year range
    // Then start with today's date (0) and alternate between the future (+1) and the past (-1)
    private candidates(month: Month, day: number): Date[] {
        const now = Days.startOf(this.clock.now());
        return array(
            range(0, -6),
            zip(range(1, 6)),
            flatMap(a => a),
            mapIgnoreError(inc => date(yearOf(now) + inc, month, day)));
    }
}

export enum InferDirection {
    Before = -1,
    After = 1,
}

export class InferYear implements DateFactory {
    private readonly date: Date;

    private constructor(date: Date, private direction: InferDirection) {
        this.date = Days.startOf(date);
    }

    static before(date: Date): DateFactory {
        return new InferYear(date, InferDirection.Before);
    }

    static after(date: Date): DateFactory {
        return new InferYear(date, InferDirection.After);
    }

    static sliding(clock: Clock = new SystemClock()) {
        const now = clock.now();
        return InferYear.before(date(yearOf(now) + 50, 1, 1));
    }

    create({year, month, day}: DateFactoryParts): Date {
        if (year && year < 10) throw new Error('Illegal year');
        if (year && year >= 100 && year < 1000) throw new Error('Illegal year');
        if (year && year >= 1000) return date(year, month, day);

        const calculatedYear = this.calculateYear(year);
        const candidate = date(calculatedYear, month, day);

        if (this.direction == InferDirection.Before && candidate < this.date) return candidate;
        if (this.direction == InferDirection.After && candidate > this.date) return candidate;

        const yearIncrement = this.calculateYearIncrement(year);
        candidate.setUTCFullYear(candidate.getUTCFullYear() + (yearIncrement * this.direction));
        return candidate
    }

    private calculateYearIncrement(year: number | undefined) {
        return typeof year === 'undefined' ? 1 : 100;
    }

    private calculateYear(year: number | undefined) {
        if (typeof year === 'undefined') return this.date.getUTCFullYear();
        const century = Math.floor(this.date.getUTCFullYear() / 100) * 100;
        return year + century;
    }
}

export class Pivot {
    /***
     * @deprecated Please use InferYear.before
     */
    static on(pivotYear: number): DateFactory {
        return InferYear.before(date(pivotYear, 1, 1))
    }

    /***
     * @deprecated Please use InferYear.sliding
     */
    static sliding(clock: Clock = new SystemClock()) {
        return InferYear.sliding(clock);
    }
}

/***
 * @deprecated Please use InferYear
 */
export class SmartDate implements DateFactory {
    constructor(private clock: Clock = new SystemClock()) {
    }

    create(parts: DateFactoryParts): Date {
        if (typeof parts.year === "undefined") {
            return InferYear.after(this.clock.now()).create(parts);
        }
        return InferYear.sliding(this.clock).create(parts);
    }
}