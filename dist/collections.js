"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncIteratorHandler = exports.single = exports.by = exports.toAsyncIterable = exports.array = exports.isArrayLike = exports.asyncIterable = exports.iterable = exports.toIterable = exports.isPromiseLike = exports.isAsyncIterable = exports.isIterable = exports.value = exports.key = exports.comparators = exports.descending = exports.ascending = void 0;
const tslib_1 = require("tslib");
const sequence_1 = require("./sequence");
function ascending(a, b) {
    if (a < b)
        return -1;
    if (a > b)
        return 1;
    return 0;
}
exports.ascending = ascending;
function descending(a, b) {
    if (a < b)
        return 1;
    if (a > b)
        return -1;
    return 0;
}
exports.descending = descending;
function comparators(...comparators) {
    return (a, b) => {
        for (const comparator of comparators) {
            const result = comparator(a, b);
            if (result != 0)
                return result;
        }
        return 0;
    };
}
exports.comparators = comparators;
function key(name) {
    return Object.assign((a) => a[name], { name });
}
exports.key = key;
function value(name) {
    return a => a[name];
}
exports.value = value;
function isIterable(instance) {
    return typeof instance == 'object' && Symbol.iterator in instance;
}
exports.isIterable = isIterable;
function isAsyncIterable(instance) {
    return typeof instance == 'object' && Symbol.asyncIterator in instance;
}
exports.isAsyncIterable = isAsyncIterable;
function isPromiseLike(instance) {
    return typeof instance == 'object' && 'then' in instance;
}
exports.isPromiseLike = isPromiseLike;
function toIterable(...t) {
    return t;
}
exports.toIterable = toIterable;
function* iterable(values) {
    for (let i = 0; i < values.length; i++) {
        yield values[i];
    }
}
exports.iterable = iterable;
function asyncIterable(values) {
    return (0, tslib_1.__asyncGenerator)(this, arguments, function* asyncIterable_1() {
        for (const t of values) {
            yield yield (0, tslib_1.__await)(t);
        }
    });
}
exports.asyncIterable = asyncIterable;
function isArrayLike(value) {
    return typeof value === "object" && typeof value['length'] === "number";
}
exports.isArrayLike = isArrayLike;
function array(source, ...transducers) {
    if (isIterable(source) || isArrayLike(source)) {
        // @ts-ignore
        return toArray((0, sequence_1.sequence)(source, ...transducers));
    }
    // @ts-ignore
    return toPromiseArray((0, sequence_1.sequence)(source, ...transducers));
}
exports.array = array;
function toArray(iterable) {
    const result = [];
    for (const value of iterable)
        result.push(value);
    return result;
}
function toPromiseArray(iterable) {
    var iterable_1, iterable_1_1;
    var e_1, _a;
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const result = [];
        try {
            for (iterable_1 = (0, tslib_1.__asyncValues)(iterable); iterable_1_1 = yield iterable_1.next(), !iterable_1_1.done;) {
                const value = iterable_1_1.value;
                result.push(value);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (iterable_1_1 && !iterable_1_1.done && (_a = iterable_1.return)) yield _a.call(iterable_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return result;
    });
}
function toAsyncIterable(promise) {
    return (0, tslib_1.__asyncGenerator)(this, arguments, function* toAsyncIterable_1() {
        yield yield (0, tslib_1.__await)(promise);
    });
}
exports.toAsyncIterable = toAsyncIterable;
function by(mapperOfKey, comparator = ascending) {
    if (typeof mapperOfKey === "function")
        return byFn(mapperOfKey, comparator);
    return byKey(mapperOfKey, comparator);
}
exports.by = by;
function byKey(key, comparator = ascending) {
    return (a, b) => {
        return comparator(a[key], b[key]);
    };
}
function byFn(mapper, comparator = ascending) {
    return (a, b) => {
        return comparator(mapper(a), mapper(b));
    };
}
function single(source, ...transducers) {
    if (isIterable(source)) {
        // @ts-ignore
        return toSingle((0, sequence_1.sequence)(source, ...transducers));
    }
    // @ts-ignore
    return toSinglePromise((0, sequence_1.sequence)(source, ...transducers));
}
exports.single = single;
function toSingle(iterable) {
    for (const a of iterable)
        return a;
    throw new Error("Expected a single value");
}
function toSinglePromise(iterable) {
    var iterable_2, iterable_2_1;
    var e_2, _a;
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        try {
            for (iterable_2 = (0, tslib_1.__asyncValues)(iterable); iterable_2_1 = yield iterable_2.next(), !iterable_2_1.done;) {
                const value = iterable_2_1.value;
                return value;
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (iterable_2_1 && !iterable_2_1.done && (_a = iterable_2.return)) yield _a.call(iterable_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
        throw new Error("Expected a single value");
    });
}
class AsyncIteratorHandler {
    constructor() {
        this.handlers = [];
        this.state = [];
    }
    value(value) {
        this.newState({ value, done: false });
    }
    error(value) {
        this.newState(value);
    }
    close() {
        this.newState({ value: undefined, done: true });
    }
    [Symbol.asyncIterator]() {
        return this;
    }
    next() {
        return new Promise((resolve, reject) => {
            this.newHandler([resolve, reject]);
        });
    }
    newState(newState) {
        const handler = this.handlers.shift();
        if (typeof handler === 'undefined')
            return this.state.push(newState);
        const oldState = this.state.shift();
        if (typeof oldState === 'undefined')
            return this.consume(newState, handler);
        this.consume(oldState, handler);
        this.newState(newState);
    }
    newHandler(newHandler) {
        const state = this.state.shift();
        if (typeof state === 'undefined')
            return this.handlers.push(newHandler);
        const oldHandler = this.handlers.shift();
        if (typeof oldHandler === 'undefined')
            return this.consume(state, newHandler);
        this.consume(state, oldHandler);
        this.newHandler(newHandler);
    }
    consume(state, [resolve, reject]) {
        if (state instanceof Error)
            reject(state);
        else
            resolve(state);
    }
}
exports.AsyncIteratorHandler = AsyncIteratorHandler;
//# sourceMappingURL=collections.js.map