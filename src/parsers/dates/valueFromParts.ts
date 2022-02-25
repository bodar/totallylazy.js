import DateTimeFormatPart = Intl.DateTimeFormatPart;

export function valueFromParts(parts: DateTimeFormatPart[], partType: Intl.DateTimeFormatPartTypes) {
    return parts.filter(p => p.type === partType).map(p => p.value).join('');
}