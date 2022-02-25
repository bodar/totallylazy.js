import {NamedRegExp} from "../characters";
import {Mapper} from "../collections";
import {caching} from "../cache";
import {get} from "../functions";
import {array} from "../array";
import {flatMap, map} from "../transducers";
import {allowedSeparators} from "./numerals";

export const boundaryDelimiters = ',.';
export const extraDelimiters = ' -/';

const trailingDelimiters = new RegExp(`[${boundaryDelimiters}]$`);

export function cleanValue(value: string): string {
    return value.replace(trailingDelimiters, '');
}

export function atBoundaryOnly(pattern: string): string {
    return `(?:^|\\s)${pattern}(?=[\\s${boundaryDelimiters}]|$)`;
}


export function mapIgnoreError<A, B>(mapper: Mapper<A, B>) {
    return flatMap((value: A) => {
        try {
            return [mapper(value)]
        } catch (e) {
            return [];
        }
    });
}

const separatorsPattern = NamedRegExp.create(`(?<separator>[${allowedSeparators}])`);

export function separatorsOf(amount: string): string[] {
    return array(separatorsPattern.exec(amount), map(([match]) => match.value));
}

export type AllowedDecimalSeparators = '.' | ',' | '٫';

export function isDecimalSeparator(value: any): value is AllowedDecimalSeparators {
    return value && typeof value === "string" && value === '.' || value === ',' || value === '٫';
}

export function decimalSeparator(value: any): AllowedDecimalSeparators {
    if (isDecimalSeparator(value)) return value;
    throw new Error(`Invalid decimal separator${value}`);
}


export const inferDecimalSeparator = caching((locale: string) =>
    get(() => decimalSeparator(new Intl.NumberFormat(locale).formatToParts(.1).find(e => e.type === 'decimal')!.value), '.'));

