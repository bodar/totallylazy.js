"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncSequence = exports.Sequence = exports.sequence = exports.range = exports.repeat = exports.iterate = void 0;
const numbers_1 = require("./numbers");
const transducers_1 = require("./transducers");
const collections_1 = require("./collections");
function* iterate(generator, value) {
    while (true) {
        yield value;
        value = generator(value);
    }
}
exports.iterate = iterate;
function* repeat(generator) {
    while (true) {
        yield generator();
    }
}
exports.repeat = repeat;
function* range(start, end, step = 1) {
    if (step === 0)
        throw new Error("step can not be 0");
    if (end === undefined) {
        yield* iterate((0, numbers_1.add)(step), start);
    }
    else {
        const absolute = Math.abs(step);
        if (end < start)
            yield* sequence(iterate((0, numbers_1.subtract)(absolute), start), (0, transducers_1.takeWhile)(n => n >= end));
        else
            yield* sequence(iterate((0, numbers_1.add)(absolute), start), (0, transducers_1.takeWhile)(n => n <= end));
    }
}
exports.range = range;
function sequence(source, ...transducers) {
    if ((0, collections_1.isIterable)(source)) {
        return new Sequence(source, transducers);
    }
    if ((0, collections_1.isArrayLike)(source)) {
        return new Sequence((0, collections_1.iterable)(source), transducers);
    }
    return new AsyncSequence(source, transducers);
}
exports.sequence = sequence;
class Sequence {
    constructor(source, transducers) {
        this.source = source;
        this.transducers = transducers;
    }
    [Symbol.iterator]() {
        return this.transducers.reduce((r, v) => v.sync(r), this.source)[Symbol.iterator]();
    }
}
exports.Sequence = Sequence;
class AsyncSequence {
    constructor(source, transducers) {
        this.source = source;
        this.transducers = transducers;
    }
    [Symbol.asyncIterator]() {
        return this.transducers.reduce((r, v) => v.async_(r), this.source)[Symbol.asyncIterator]();
    }
}
exports.AsyncSequence = AsyncSequence;
//# sourceMappingURL=sequence.js.map