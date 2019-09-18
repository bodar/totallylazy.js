declare global {
    interface String {
        toLocaleLowerCase(locale: string): string;

        toLocaleUpperCase(locale: string): string;
    }
}

export function date(year: number, month?: number, day?: number): Date {
    return new Date(Date.UTC(year, month ? month - 1 : 0, day ? day : 1));
}

export type MonthFormat = 'numeric' | '2-digit' | 'short' | 'long';
export type WeekdayFormat = 'short' | 'long';

export interface Options {
    year?: 'numeric' | '2-digit';
    month?: MonthFormat;
    day?: 'numeric' | '2-digit';
    weekday?: WeekdayFormat;
}

export const defaultOptions: Options = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: 'long',
};

