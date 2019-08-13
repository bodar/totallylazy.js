export type Names = string[];

const namesRegex = /\(\?<([^>]+)>/g;

export type NonMatch = string;

export class NamedRegExp {
    constructor(public pattern: RegExp, public names: Names) {
    }

    static create(originalPattern: string, flags?: string): NamedRegExp {
        const names: Names = [];
        const pattern = replace(namesRegex, originalPattern, match => {
            names.push(match[1]);
            return '(';
        });
        return new NamedRegExp(new RegExp(pattern, flags), names);
    }

    match(value: string): NamedMatch[] {
        const result = value.match(this.pattern);
        if (!result) return [];
        return this.namedMatch(result);
    }

    private namedMatch(result: RegExpMatchArray) {
        const values = result.slice(1);
        return values.map((v, i) => ({name: this.names[i], value: v}));
    }

    * exec(value:string): Iterable<NamedMatch[]> {
        const stateful = new RegExp(this.pattern.source, 'g');
        while (true) {
            const match = stateful.exec(value);
            if (!match) break;
            yield this.namedMatch(match);
        }
    }

    * iterate(value:string): Iterable<NamedMatch[]|NonMatch> {
        let position = 0;
        const stateful = new RegExp(this.pattern.source, 'g');
        while (true) {
            const match = stateful.exec(value);
            if (!match) break;
            const nonMatch = value.substring(position, match.index);
            if(nonMatch) yield nonMatch;
            yield this.namedMatch(match);
            position = stateful.lastIndex;
        }
        const nonMatch = value.substring(position);
        if(nonMatch) yield nonMatch;
    }

    toString() {
        return `Pattern: ${this.pattern} Names: ${JSON.stringify(this.names)}`;
    }
}

export function isNamedMatch(value: NamedMatch[]|NonMatch): value is NamedMatch[] {
    return Array.isArray(value);
}

export function isNonMatch(value: NamedMatch[]|NonMatch): value is NonMatch {
    return typeof value === "string";
}

export interface NamedMatch {
    name: string;
    value: string;
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


export function removeUnneededUnicodeCharacters(char:string):boolean{
    return char.charCodeAt(0) != 8206;
}

export function characters(value:string):string[] {
    return split(value).filter(removeUnneededUnicodeCharacters);
}

function split(value:string):string[] {
    if(typeof Symbol === "function" && value[Symbol.iterator]) return [...value];
    return splitByRegex(value);
}

const splitter = /(?=(?:[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))/;
export function splitByRegex(value: string):string[] {
    return value.split(splitter)
}
