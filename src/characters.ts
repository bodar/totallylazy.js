export interface Names {
    [key: string]: number;
}

export interface NamedGroups {
    names: Names;
    pattern: string;
}

const namesRegex = /\(\?<([^>]+)>/g;

export function namedGroups(originalPattern:string): NamedGroups{
    let index = 0;
    const names: Names = {};
    const pattern = replace(namesRegex, originalPattern, match => {
        names[match[1]] = ++index;
        return '(';
    });
    return {names: names, pattern};
}


export function replace(regex: RegExp, value: string, replacer: (match: RegExpExecArray) => string, nonMatchedReplacer: (a: string) => string = (value) => value) {
    const result = [];

    let position = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(value)) != null) {
        result.push(nonMatchedReplacer(value.substring(position, match.index)));
        result.push(replacer(match));
        position = regex.lastIndex;
    }
    result.push(nonMatchedReplacer(value.substring(position)));

    return result.join("");
}

export function prefix(charactersA: string[], charactersB: string[]): number {
    for (let i = 0; i < charactersA.length; i++) {
        const characterA = charactersA[i];
        const characterB = charactersB[i];
        if (characterA != characterB) return i;
    }
    return charactersA.length;
}

export function suffix(charactersA: string[], charactersB: string[]): number {
    return prefix([...charactersA].reverse(), [...charactersB].reverse());
}

export function different(values: string[]): string[] {
    const chars = values.map(characters);

    const [smallestPrefix, smallestSuffix] = chars.reduce(([sp, ss], current, i) => {
        const next = i < chars.length - 1 ? chars[i + 1] : chars[0];
        const p = prefix(current, next);
        const s = suffix(current, next);
        return [p < sp ? p : sp, s < ss ? s : ss];
    }, [Number.MAX_VALUE, Number.MAX_VALUE]);

    return chars.map((current) => {
        return current.slice(smallestPrefix, smallestSuffix ? -smallestSuffix : undefined).join('')
    });
}

export function characters(value:string):string[] {
    if(typeof Symbol === "function" && value[Symbol.iterator]) return [...value];
    return value.split(/(?=(?:[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))/);
}