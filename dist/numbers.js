"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sum = exports.subtract = exports.add = exports.increment = void 0;
function increment(a) {
    return a + 1;
}
exports.increment = increment;
function add(a, b) {
    if (b === undefined)
        return (b) => a + b;
    else
        return a + b;
}
exports.add = add;
function subtract(a, b) {
    if (b === undefined)
        return (b) => b - a;
    else
        return a - b;
}
exports.subtract = subtract;
const sum = (a, b) => a + b;
exports.sum = sum;
//# sourceMappingURL=numbers.js.map