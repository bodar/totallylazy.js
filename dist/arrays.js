"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unique = exports.flatten = void 0;
function flatten(values) {
    return values.reduce((a, ms) => a.concat(ms), []);
}
exports.flatten = flatten;
function isNativeFunction(instance) {
    return typeof instance === 'function' && instance.toString().includes('native code');
}
const setSupported = isNativeFunction(Set) && new Set([1]).size === 1;
function unique(a) {
    if (isNativeFunction(Array.from) && setSupported)
        return Array.from(new Set(a));
    const result = [];
    for (const item of a) {
        if (result.indexOf(item) < 0) {
            result.push(item);
        }
    }
    return result;
}
exports.unique = unique;
//# sourceMappingURL=arrays.js.map