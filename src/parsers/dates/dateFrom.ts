import {DateFactory} from "./core";
import {DefaultDateFactory} from "./defaultDateFactory";
import {numberParser} from "../numberParser";
import {get} from "../../functions";
import DateTimeFormatPart = Intl.DateTimeFormatPart;
import {Months, Weekdays} from "./formatters";

export function dateFrom(parts: DateTimeFormatPart[],
                         locale: string,
                         factory: DateFactory = new DefaultDateFactory()): Date {
    const parser = numberParser('.', locale);
    const dayText = parts.find(p => p.type === 'day');
    if (!dayText) throw new Error("No day found");
    const day = parser.parse(dayText.value);

    const monthText = parts.find(p => p.type === 'month');
    if (!monthText) throw new Error("No month found");
    const month = Months.get(locale).parse(monthText.value);

    const yearText = parts.find(p => p.type === 'year');
    const year = yearText ? parser.parse(yearText.value) : undefined;

    const weekdayText = parts.find(p => p.type === 'weekday');
    const weekday = weekdayText ? get(() => Weekdays.get(locale).parse(weekdayText.value)) : undefined;

    return factory.create({year, month, day, weekday});
}