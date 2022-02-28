"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitByRegex = exports.characters = exports.removeUnicodeMarkers = exports.different = exports.suffix = exports.prefix = exports.replace = exports.isNonMatch = exports.isNamedMatch = exports.NamedRegExp = void 0;
const namesRegex = /\(\?<([^>]+)>/g;
class NamedRegExp {
    constructor(pattern, names) {
        this.pattern = pattern;
        this.names = names;
    }
    static create(originalPattern, flags) {
        const names = [];
        const pattern = replace(namesRegex, originalPattern, match => {
            names.push(match[1]);
            return '(';
        });
        return new NamedRegExp(new RegExp(pattern, flags), names);
    }
    match(value) {
        const result = value.match(this.pattern);
        if (!result)
            return [];
        return this.namedMatch(result);
    }
    namedMatch(result) {
        const values = result.slice(1);
        return values.map((v, i) => ({ name: this.names[i], value: v }));
    }
    *exec(value) {
        const stateful = new RegExp(this.pattern.source, 'g');
        while (true) {
            const match = stateful.exec(value);
            if (!match)
                break;
            yield this.namedMatch(match);
        }
    }
    *iterate(value) {
        let position = 0;
        const stateful = new RegExp(this.pattern.source, 'g');
        while (true) {
            const match = stateful.exec(value);
            if (!match)
                break;
            const nonMatch = value.substring(position, match.index);
            if (nonMatch)
                yield nonMatch;
            yield this.namedMatch(match);
            position = stateful.lastIndex;
        }
        const nonMatch = value.substring(position);
        if (nonMatch)
            yield nonMatch;
    }
    toString() {
        return `Pattern: ${this.pattern} Names: ${JSON.stringify(this.names)}`;
    }
    toJSON() {
        return {
            pattern: this.pattern.source,
            names: this.names
        };
    }
}
exports.NamedRegExp = NamedRegExp;
function isNamedMatch(value) {
    return Array.isArray(value);
}
exports.isNamedMatch = isNamedMatch;
function isNonMatch(value) {
    return typeof value === "string";
}
exports.isNonMatch = isNonMatch;
function replace(regex, value, replacer, nonMatchedReplacer = (value) => value) {
    const result = [];
    let position = 0;
    let match;
    while ((match = regex.exec(value)) != null) {
        result.push(nonMatchedReplacer(value.substring(position, match.index)));
        result.push(replacer(match));
        position = regex.lastIndex;
    }
    result.push(nonMatchedReplacer(value.substring(position)));
    return result.join("");
}
exports.replace = replace;
function prefix(charactersA, charactersB) {
    for (let i = 0; i < charactersA.length; i++) {
        const characterA = charactersA[i];
        const characterB = charactersB[i];
        if (characterA != characterB)
            return i;
    }
    return charactersA.length;
}
exports.prefix = prefix;
function suffix(charactersA, charactersB) {
    return prefix([...charactersA].reverse(), [...charactersB].reverse());
}
exports.suffix = suffix;
function different(values) {
    const chars = values.map(characters);
    const [smallestPrefix, smallestSuffix] = chars.reduce(([sp, ss], current, i) => {
        const next = i < chars.length - 1 ? chars[i + 1] : chars[0];
        const p = prefix(current, next);
        const s = suffix(current, next);
        return [p < sp ? p : sp, s < ss ? s : ss];
    }, [Number.MAX_VALUE, Number.MAX_VALUE]);
    return chars.map((current) => {
        return current.slice(smallestPrefix, smallestSuffix ? -smallestSuffix : undefined).join('');
    });
}
exports.different = different;
function removeUnicodeMarkers(value) {
    return value.replace(/[\u200E\u200F]/g, '');
}
exports.removeUnicodeMarkers = removeUnicodeMarkers;
function characters(value) {
    return split(removeUnicodeMarkers(value));
}
exports.characters = characters;
function split(value) {
    if (typeof Symbol === "function" && value[Symbol.iterator])
        return [...value];
    return splitByRegex(value);
}
const splitter = /(?=(?:[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))/;
function splitByRegex(value) {
    return value.split(splitter);
}
exports.splitByRegex = splitByRegex;
//# sourceMappingURL=characters.js.map