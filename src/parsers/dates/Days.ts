import {date, dayOf, monthOf, yearOf} from "../../dates";

export class Days {
    static milliseconds = 24 * 60 * 60 * 1000;

    static startOf(value: Date) {
        return date(yearOf(value), monthOf(value), dayOf(value));
    }

    static add(date: Date, days: number) {
        const newDate = new Date(date.getTime());
        newDate.setUTCDate(date.getUTCDate() + days);
        return newDate;
    }

    static subtract(date: Date, days: number) {
        return Days.add(date, days * -1);
    }

    static between(a: Date, b: Date): number {
        return Math.abs((a.getTime() - b.getTime()) / Days.milliseconds);
    }
}