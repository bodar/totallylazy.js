"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.isPartial = exports.RegexMatcher = exports.regex = exports.CaseMatcher = exports.default_ = exports.case_ = exports.match = void 0;
function match(instance, ...matchers) {
    for (let i = 0; i < matchers.length; i++) {
        const matcher = matchers[i];
        const result = matcher.matches(instance);
        if (typeof result != 'undefined')
            return result;
    }
    throw new Error("Non exhaustive matches detected");
}
exports.match = match;
function case_(pattern, handler) {
    return new CaseMatcher(pattern, handler);
}
exports.case_ = case_;
function default_(handler) {
    return case_({}, handler);
}
exports.default_ = default_;
class CaseMatcher {
    constructor(pattern, handler) {
        this.pattern = pattern;
        this.handler = handler;
    }
    matches(instance) {
        let result = apply(instance, this.pattern);
        if (typeof result == 'undefined')
            return undefined;
        return this.handler(result);
    }
}
exports.CaseMatcher = CaseMatcher;
function regex(value) {
    return new RegexMatcher(value);
}
exports.regex = regex;
class RegexMatcher {
    constructor(value) {
        this.value = value;
    }
    matches(instance) {
        const match = this.value.exec(instance.toString());
        return match ? match.slice(1) : undefined;
    }
}
exports.RegexMatcher = RegexMatcher;
function isPartial(instance, partial) {
    return Object.keys(partial).every(function (k) {
        let key = k;
        let actual = instance[key];
        let expected = partial[key];
        if (actual instanceof Object && expected instanceof Object) {
            return isPartial(actual, expected);
        }
        return partial[key] === actual;
    });
}
exports.isPartial = isPartial;
function value(instance, key) {
    const value = instance[key];
    if (typeof value === 'undefined') {
        const lower = key.toString().toLowerCase();
        const keys = Object.keys(instance);
        for (const k of keys) {
            if (lower === k.toLowerCase())
                return instance[k];
        }
    }
    return value;
}
function apply(instance, pattern) {
    let clone = Object.assign({}, instance);
    const keys = Object.keys(pattern);
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let actual = value(instance, key);
        let expected = pattern[key];
        if (typeof expected == 'undefined')
            continue;
        if (expected instanceof Object && 'matches' in expected) {
            let result = expected.matches(actual);
            if (typeof result == 'undefined')
                return undefined;
            clone[key] = result;
        }
        else if (actual instanceof Object && expected instanceof Object) {
            let result = apply(actual, expected);
            if (typeof result == 'undefined')
                return undefined;
            clone[key] = result;
        }
        else if (expected !== actual)
            return undefined;
    }
    return clone;
}
exports.apply = apply;
//# sourceMappingURL=pattern.js.map