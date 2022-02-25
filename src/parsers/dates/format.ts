import {defaultOptions, Format, Options} from "./core";
import {Formatters} from "./formatters";

export function format(value: Date, locale: string, options: Format | Options = defaultOptions): string {
    if (value == undefined) throw new Error("Date format requires a value");
    return Formatters.create(locale, options).format(value);
}