export function date(year: number, month?: number, day?: number): Date {
    if (month && (month < 1 || month > 12)) throw new Error(`Invalid month ${month}`);
    if (day && (day < 1 || day > 31)) throw new Error(`Invalid day ${day}`);
    const date = new Date(Date.UTC(year, month ? month - 1 : 0, day ? day : 1));
    if (year !== yearOf(date)) throw new Error(`Invalid year ${year}`);
    if (month && month !== monthOf(date)) throw new Error(`Invalid month ${month}`);
    if (day && day !== dayOf(date)) throw new Error(`Invalid day ${day}`);
    return date;
}

/**
 * Human-readable and ISO 8601 compatible
 */
export enum Weekday {
    Monday = 1,
    Tuesday,
    Wednesday,
    Thursday,
    Friday,
    Saturday,
    Sunday
}

export function weekdayOf(date: Date): Weekday {
    const result = date.getUTCDay();
    if (result === 0) return Weekday.Sunday;
    return result;
}

/**
 * Human-readable and ISO 8601 compatible
 */
export enum Month {
    January = 1,
    February,
    March,
    April,
    May,
    June,
    July,
    August,
    September,
    October,
    November,
    December
}

export function monthOf(date: Date): Month {
    return date.getUTCMonth() + 1;
}

export function dayOf(date: Date): number {
    return date.getUTCDate();
}

export function yearOf(date: Date): number {
    return date.getUTCFullYear();
}

