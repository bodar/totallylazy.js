export const boundaryDelimiters = ',.';

const trailingDelimiters = new RegExp(`[${boundaryDelimiters}]$`);

export function cleanValue(value: string): string {
    return value.replace(trailingDelimiters, '').trim();
}

export function atBoundaryOnly(pattern: string): string {
    return `(?:^|\\s)${pattern}(?=[\\s${boundaryDelimiters}]|$)`;
}

