"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowedTransducer = exports.windowed = exports.unique = exports.UniqueTransducer = exports.dedupe = exports.DedupTransducer = exports.sort = exports.SortTransducer = exports.takeWhile = exports.TakeWhileTransducer = exports.dropWhile = exports.DropWhileTransducer = exports.drop = exports.DropTransducer = exports.take = exports.TakeTransducer = exports.reduce = exports.scan = exports.ScanTransducer = exports.decompose = exports.compose = exports.CompositeTransducer = exports.find = exports.reject = exports.filter = exports.FilterTransducer = exports.flatMap = exports.FlatMapTransducer = exports.zipWithIndex = exports.zip = exports.ZipTransducer = exports.map = exports.MapTransducer = exports.last = exports.LastTransducer = exports.first = exports.FirstTransducer = exports.transducer = exports.identity = exports.IdentityTransducer = void 0;
const tslib_1 = require("tslib");
const collections_1 = require("./collections");
const avltree_1 = require("./avltree");
const sequence_1 = require("./sequence");
class IdentityTransducer {
    async_(iterable) {
        return iterable;
    }
    sync(iterable) {
        return iterable;
    }
}
exports.IdentityTransducer = IdentityTransducer;
function identity() {
    return new IdentityTransducer();
}
exports.identity = identity;
// alias
exports.transducer = identity;
class FirstTransducer {
    async_(iterable) {
        return (0, tslib_1.__asyncGenerator)(this, arguments, function* async_1() {
            var e_1, _a;
            try {
                for (var iterable_1 = (0, tslib_1.__asyncValues)(iterable), iterable_1_1; iterable_1_1 = yield (0, tslib_1.__await)(iterable_1.next()), !iterable_1_1.done;) {
                    const a = iterable_1_1.value;
                    return yield (0, tslib_1.__await)(yield yield (0, tslib_1.__await)(a));
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (iterable_1_1 && !iterable_1_1.done && (_a = iterable_1.return)) yield (0, tslib_1.__await)(_a.call(iterable_1));
                }
                finally { if (e_1) throw e_1.error; }
            }
        });
    }
    *sync(iterable) {
        for (const a of iterable) {
            return yield a;
        }
    }
}
exports.FirstTransducer = FirstTransducer;
function first() {
    return new FirstTransducer();
}
exports.first = first;
class LastTransducer {
    async_(iterable) {
        return (0, tslib_1.__asyncGenerator)(this, arguments, function* async_2() {
            var e_2, _a;
            let last;
            try {
                for (var iterable_2 = (0, tslib_1.__asyncValues)(iterable), iterable_2_1; iterable_2_1 = yield (0, tslib_1.__await)(iterable_2.next()), !iterable_2_1.done;) {
                    last = iterable_2_1.value;
                    ;
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (iterable_2_1 && !iterable_2_1.done && (_a = iterable_2.return)) yield (0, tslib_1.__await)(_a.call(iterable_2));
                }
                finally { if (e_2) throw e_2.error; }
            }
            if (last !== undefined)
                yield yield (0, tslib_1.__await)(last);
        });
    }
    *sync(iterable) {
        let last;
        for (last of iterable)
            ;
        if (last !== undefined)
            yield last;
    }
}
exports.LastTransducer = LastTransducer;
function last() {
    return new LastTransducer();
}
exports.last = last;
class MapTransducer {
    constructor(mapper) {
        this.mapper = mapper;
    }
    async_(iterable) {
        return (0, tslib_1.__asyncGenerator)(this, arguments, function* async_3() {
            var e_3, _a;
            try {
                for (var iterable_3 = (0, tslib_1.__asyncValues)(iterable), iterable_3_1; iterable_3_1 = yield (0, tslib_1.__await)(iterable_3.next()), !iterable_3_1.done;) {
                    const a = iterable_3_1.value;
                    yield yield (0, tslib_1.__await)(this.mapper(a));
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (iterable_3_1 && !iterable_3_1.done && (_a = iterable_3.return)) yield (0, tslib_1.__await)(_a.call(iterable_3));
                }
                finally { if (e_3) throw e_3.error; }
            }
        });
    }
    *sync(iterable) {
        for (const a of iterable) {
            yield this.mapper(a);
        }
    }
}
exports.MapTransducer = MapTransducer;
function map(mapper) {
    return new MapTransducer(mapper);
}
exports.map = map;
class ZipTransducer {
    constructor(other) {
        this.other = other;
    }
    async_(iterable) {
        return (0, tslib_1.__asyncGenerator)(this, arguments, function* async_4() {
            if (!(0, collections_1.isAsyncIterable)(this.other))
                throw new Error("Unsupported operation exception");
            const iteratorA = iterable[Symbol.asyncIterator]();
            const iteratorB = this.other[Symbol.asyncIterator]();
            while (true) {
                const [resultA, resultB] = yield (0, tslib_1.__await)(Promise.all([iteratorA.next(), iteratorB.next()]));
                if (resultA.done || resultB.done)
                    return yield (0, tslib_1.__await)(void 0);
                yield yield (0, tslib_1.__await)([resultA.value, resultB.value]);
            }
        });
    }
    *sync(iterable) {
        if (!(0, collections_1.isIterable)(this.other))
            throw new Error("Unsupported operation exception");
        const iteratorA = iterable[Symbol.iterator]();
        const iteratorB = this.other[Symbol.iterator]();
        while (true) {
            const resultA = iteratorA.next(), resultB = iteratorB.next();
            if (resultA.done || resultB.done)
                return;
            yield [resultA.value, resultB.value];
        }
    }
}
exports.ZipTransducer = ZipTransducer;
function zip(other) {
    return new ZipTransducer(other);
}
exports.zip = zip;
function zipWithIndex() {
    return new ZipTransducer((0, sequence_1.range)(0));
}
exports.zipWithIndex = zipWithIndex;
class FlatMapTransducer {
    constructor(mapper) {
        this.mapper = mapper;
    }
    async_(iterable) {
        return (0, tslib_1.__asyncGenerator)(this, arguments, function* async_5() {
            var e_4, _a;
            try {
                for (var iterable_4 = (0, tslib_1.__asyncValues)(iterable), iterable_4_1; iterable_4_1 = yield (0, tslib_1.__await)(iterable_4.next()), !iterable_4_1.done;) {
                    const a = iterable_4_1.value;
                    yield (0, tslib_1.__await)(yield* (0, tslib_1.__asyncDelegator)((0, tslib_1.__asyncValues)(this.mapper(a))));
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (iterable_4_1 && !iterable_4_1.done && (_a = iterable_4.return)) yield (0, tslib_1.__await)(_a.call(iterable_4));
                }
                finally { if (e_4) throw e_4.error; }
            }
        });
    }
    *sync(iterable) {
        for (const a of iterable) {
            yield* this.mapper(a);
        }
    }
}
exports.FlatMapTransducer = FlatMapTransducer;
function flatMap(mapper) {
    return new FlatMapTransducer(mapper);
}
exports.flatMap = flatMap;
class FilterTransducer {
    constructor(predicate) {
        this.predicate = predicate;
    }
    async_(iterable) {
        return (0, tslib_1.__asyncGenerator)(this, arguments, function* async_6() {
            var e_5, _a;
            try {
                for (var iterable_5 = (0, tslib_1.__asyncValues)(iterable), iterable_5_1; iterable_5_1 = yield (0, tslib_1.__await)(iterable_5.next()), !iterable_5_1.done;) {
                    const a = iterable_5_1.value;
                    if (this.predicate(a))
                        yield yield (0, tslib_1.__await)(a);
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (iterable_5_1 && !iterable_5_1.done && (_a = iterable_5.return)) yield (0, tslib_1.__await)(_a.call(iterable_5));
                }
                finally { if (e_5) throw e_5.error; }
            }
        });
    }
    *sync(iterable) {
        for (const a of iterable) {
            if (this.predicate(a))
                yield a;
        }
    }
}
exports.FilterTransducer = FilterTransducer;
function filter(predicate) {
    return new FilterTransducer(predicate);
}
exports.filter = filter;
function reject(predicate) {
    return new FilterTransducer(a => !predicate(a));
}
exports.reject = reject;
function find(predicate) {
    return compose(filter(predicate), first());
}
exports.find = find;
class CompositeTransducer {
    constructor(a, b) {
        this.a = a;
        this.b = b;
    }
    async_(iterator) {
        return this.b.async_(this.a.async_(iterator));
    }
    sync(iterator) {
        return this.b.sync(this.a.sync(iterator));
    }
}
exports.CompositeTransducer = CompositeTransducer;
function compose(a, b) {
    return new CompositeTransducer(a, b);
}
exports.compose = compose;
function* decompose(transducer) {
    if (transducer instanceof CompositeTransducer) {
        yield* decompose(transducer.a);
        yield* decompose(transducer.b);
    }
    else {
        yield transducer;
    }
}
exports.decompose = decompose;
class ScanTransducer {
    constructor(reducer, seed) {
        this.reducer = reducer;
        this.seed = seed;
    }
    async_(iterable) {
        return (0, tslib_1.__asyncGenerator)(this, arguments, function* async_7() {
            var e_6, _a;
            let accumulator = this.seed;
            yield yield (0, tslib_1.__await)(accumulator);
            try {
                for (var iterable_6 = (0, tslib_1.__asyncValues)(iterable), iterable_6_1; iterable_6_1 = yield (0, tslib_1.__await)(iterable_6.next()), !iterable_6_1.done;) {
                    const a = iterable_6_1.value;
                    yield yield (0, tslib_1.__await)(accumulator = this.reducer(accumulator, a));
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (iterable_6_1 && !iterable_6_1.done && (_a = iterable_6.return)) yield (0, tslib_1.__await)(_a.call(iterable_6));
                }
                finally { if (e_6) throw e_6.error; }
            }
        });
    }
    *sync(iterable) {
        let accumulator = this.seed;
        yield accumulator;
        for (const a of iterable) {
            yield accumulator = this.reducer(accumulator, a);
        }
    }
}
exports.ScanTransducer = ScanTransducer;
function scan(reducer, seed) {
    return new ScanTransducer(reducer, seed);
}
exports.scan = scan;
function reduce(reducer, seed) {
    return compose(scan(reducer, seed), last());
}
exports.reduce = reduce;
class TakeTransducer {
    constructor(count) {
        this.count = count;
        if (typeof count === "undefined")
            throw new Error('Count can not be undefined');
    }
    async_(iterable) {
        return (0, tslib_1.__asyncGenerator)(this, arguments, function* async_8() {
            var e_7, _a;
            if (this.count < 1)
                return yield (0, tslib_1.__await)(void 0);
            try {
                for (var iterable_7 = (0, tslib_1.__asyncValues)(iterable), iterable_7_1; iterable_7_1 = yield (0, tslib_1.__await)(iterable_7.next()), !iterable_7_1.done;) {
                    const a = iterable_7_1.value;
                    yield yield (0, tslib_1.__await)(a);
                    if ((--this.count) < 1)
                        return yield (0, tslib_1.__await)(void 0);
                }
            }
            catch (e_7_1) { e_7 = { error: e_7_1 }; }
            finally {
                try {
                    if (iterable_7_1 && !iterable_7_1.done && (_a = iterable_7.return)) yield (0, tslib_1.__await)(_a.call(iterable_7));
                }
                finally { if (e_7) throw e_7.error; }
            }
        });
    }
    *sync(iterable) {
        if (this.count < 1)
            return;
        for (const a of iterable) {
            yield a;
            if ((--this.count) < 1)
                return;
        }
    }
}
exports.TakeTransducer = TakeTransducer;
function take(count) {
    return new TakeTransducer(count);
}
exports.take = take;
class DropTransducer {
    constructor(count) {
        this.count = count;
        if (typeof count === "undefined")
            throw new Error('Count can not be undefined');
    }
    async_(iterable) {
        return (0, tslib_1.__asyncGenerator)(this, arguments, function* async_9() {
            var e_8, _a;
            try {
                for (var iterable_8 = (0, tslib_1.__asyncValues)(iterable), iterable_8_1; iterable_8_1 = yield (0, tslib_1.__await)(iterable_8.next()), !iterable_8_1.done;) {
                    const a = iterable_8_1.value;
                    if (--this.count < 0)
                        yield yield (0, tslib_1.__await)(a);
                }
            }
            catch (e_8_1) { e_8 = { error: e_8_1 }; }
            finally {
                try {
                    if (iterable_8_1 && !iterable_8_1.done && (_a = iterable_8.return)) yield (0, tslib_1.__await)(_a.call(iterable_8));
                }
                finally { if (e_8) throw e_8.error; }
            }
        });
    }
    *sync(iterable) {
        for (const a of iterable) {
            if (--this.count < 0)
                yield a;
        }
    }
}
exports.DropTransducer = DropTransducer;
function drop(count) {
    return new DropTransducer(count);
}
exports.drop = drop;
class DropWhileTransducer {
    constructor(predicate) {
        this.predicate = predicate;
    }
    async_(iterable) {
        return (0, tslib_1.__asyncGenerator)(this, arguments, function* async_10() {
            var e_9, _a;
            let shouldDrop = true;
            try {
                for (var iterable_9 = (0, tslib_1.__asyncValues)(iterable), iterable_9_1; iterable_9_1 = yield (0, tslib_1.__await)(iterable_9.next()), !iterable_9_1.done;) {
                    const a = iterable_9_1.value;
                    if (shouldDrop)
                        shouldDrop = this.predicate(a);
                    if (!shouldDrop)
                        yield yield (0, tslib_1.__await)(a);
                }
            }
            catch (e_9_1) { e_9 = { error: e_9_1 }; }
            finally {
                try {
                    if (iterable_9_1 && !iterable_9_1.done && (_a = iterable_9.return)) yield (0, tslib_1.__await)(_a.call(iterable_9));
                }
                finally { if (e_9) throw e_9.error; }
            }
        });
    }
    *sync(iterable) {
        let shouldDrop = true;
        for (const a of iterable) {
            if (shouldDrop)
                shouldDrop = this.predicate(a);
            if (!shouldDrop)
                yield a;
        }
    }
}
exports.DropWhileTransducer = DropWhileTransducer;
function dropWhile(predicate) {
    return new DropWhileTransducer(predicate);
}
exports.dropWhile = dropWhile;
class TakeWhileTransducer {
    constructor(predicate) {
        this.predicate = predicate;
    }
    async_(iterable) {
        return (0, tslib_1.__asyncGenerator)(this, arguments, function* async_11() {
            var e_10, _a;
            try {
                for (var iterable_10 = (0, tslib_1.__asyncValues)(iterable), iterable_10_1; iterable_10_1 = yield (0, tslib_1.__await)(iterable_10.next()), !iterable_10_1.done;) {
                    const a = iterable_10_1.value;
                    if (this.predicate(a))
                        yield yield (0, tslib_1.__await)(a);
                    else
                        return yield (0, tslib_1.__await)(void 0);
                }
            }
            catch (e_10_1) { e_10 = { error: e_10_1 }; }
            finally {
                try {
                    if (iterable_10_1 && !iterable_10_1.done && (_a = iterable_10.return)) yield (0, tslib_1.__await)(_a.call(iterable_10));
                }
                finally { if (e_10) throw e_10.error; }
            }
        });
    }
    *sync(iterable) {
        for (const a of iterable) {
            if (this.predicate(a))
                yield a;
            else
                return;
        }
    }
}
exports.TakeWhileTransducer = TakeWhileTransducer;
function takeWhile(predicate) {
    return new TakeWhileTransducer(predicate);
}
exports.takeWhile = takeWhile;
class SortTransducer {
    constructor(comparator) {
        this.comparator = comparator;
    }
    async_(iterable) {
        return (0, tslib_1.__asyncGenerator)(this, arguments, function* async_12() {
            const result = yield (0, tslib_1.__await)((0, collections_1.array)(iterable));
            result.sort(this.comparator);
            yield (0, tslib_1.__await)(yield* (0, tslib_1.__asyncDelegator)((0, tslib_1.__asyncValues)(result)));
        });
    }
    *sync(iterable) {
        const result = (0, collections_1.array)(iterable);
        result.sort(this.comparator);
        yield* result;
    }
}
exports.SortTransducer = SortTransducer;
function sort(comparator = collections_1.ascending) {
    return new SortTransducer(comparator);
}
exports.sort = sort;
class DedupTransducer {
    constructor(comparator) {
        this.comparator = comparator;
    }
    async_(iterable) {
        return (0, tslib_1.__asyncGenerator)(this, arguments, function* async_13() {
            var e_11, _a;
            let previous;
            try {
                for (var iterable_11 = (0, tslib_1.__asyncValues)(iterable), iterable_11_1; iterable_11_1 = yield (0, tslib_1.__await)(iterable_11.next()), !iterable_11_1.done;) {
                    const current = iterable_11_1.value;
                    if (typeof previous === 'undefined')
                        yield yield (0, tslib_1.__await)(current);
                    else if (this.comparator(current, previous) !== 0)
                        yield yield (0, tslib_1.__await)(current);
                    previous = current;
                }
            }
            catch (e_11_1) { e_11 = { error: e_11_1 }; }
            finally {
                try {
                    if (iterable_11_1 && !iterable_11_1.done && (_a = iterable_11.return)) yield (0, tslib_1.__await)(_a.call(iterable_11));
                }
                finally { if (e_11) throw e_11.error; }
            }
        });
    }
    *sync(iterable) {
        let previous;
        for (const current of iterable) {
            if (typeof previous === 'undefined')
                yield current;
            else if (this.comparator(current, previous) !== 0)
                yield current;
            previous = current;
        }
    }
}
exports.DedupTransducer = DedupTransducer;
function dedupe(comparator = collections_1.ascending) {
    return new DedupTransducer(comparator);
}
exports.dedupe = dedupe;
class UniqueTransducer {
    constructor(comparator) {
        this.comparator = comparator;
    }
    async_(iterable) {
        return (0, tslib_1.__asyncGenerator)(this, arguments, function* async_14() {
            var e_12, _a;
            let values = avltree_1.AVLTree.empty(this.comparator);
            try {
                for (var iterable_12 = (0, tslib_1.__asyncValues)(iterable), iterable_12_1; iterable_12_1 = yield (0, tslib_1.__await)(iterable_12.next()), !iterable_12_1.done;) {
                    const current = iterable_12_1.value;
                    if (!values.contains(current)) {
                        values = values.insert(current, undefined);
                        yield yield (0, tslib_1.__await)(current);
                    }
                }
            }
            catch (e_12_1) { e_12 = { error: e_12_1 }; }
            finally {
                try {
                    if (iterable_12_1 && !iterable_12_1.done && (_a = iterable_12.return)) yield (0, tslib_1.__await)(_a.call(iterable_12));
                }
                finally { if (e_12) throw e_12.error; }
            }
        });
    }
    *sync(iterable) {
        let values = avltree_1.AVLTree.empty(this.comparator);
        for (const current of iterable) {
            if (!values.contains(current)) {
                values = values.insert(current, undefined);
                yield current;
            }
        }
    }
}
exports.UniqueTransducer = UniqueTransducer;
function unique(comparator = collections_1.ascending) {
    return new UniqueTransducer(comparator);
}
exports.unique = unique;
function windowed(size, step = 1, remainder = false) {
    return new WindowedTransducer(size, step, remainder);
}
exports.windowed = windowed;
class WindowedTransducer {
    constructor(size, step, remainder) {
        this.size = size;
        this.step = step;
        this.remainder = remainder;
    }
    async_(iterable) {
        return (0, tslib_1.__asyncGenerator)(this, arguments, function* async_15() {
            var e_13, _a;
            let buffer = [];
            let skip = 0;
            try {
                for (var iterable_13 = (0, tslib_1.__asyncValues)(iterable), iterable_13_1; iterable_13_1 = yield (0, tslib_1.__await)(iterable_13.next()), !iterable_13_1.done;) {
                    const current = iterable_13_1.value;
                    if (skip > 0) {
                        skip--;
                        continue;
                    }
                    buffer.push(current);
                    if (buffer.length === this.size) {
                        yield yield (0, tslib_1.__await)([...buffer]);
                        buffer = buffer.slice(this.step);
                        if (this.step > this.size)
                            skip = this.step - this.size;
                    }
                }
            }
            catch (e_13_1) { e_13 = { error: e_13_1 }; }
            finally {
                try {
                    if (iterable_13_1 && !iterable_13_1.done && (_a = iterable_13.return)) yield (0, tslib_1.__await)(_a.call(iterable_13));
                }
                finally { if (e_13) throw e_13.error; }
            }
            if (this.remainder)
                yield yield (0, tslib_1.__await)([...buffer]);
        });
    }
    *sync(iterable) {
        let buffer = [];
        let skip = 0;
        for (const current of iterable) {
            if (skip > 0) {
                skip--;
                continue;
            }
            buffer.push(current);
            if (buffer.length === this.size) {
                yield [...buffer];
                buffer = buffer.slice(this.step);
                if (this.step > this.size)
                    skip = this.step - this.size;
            }
        }
        if (this.remainder)
            yield [...buffer];
    }
}
exports.WindowedTransducer = WindowedTransducer;
//# sourceMappingURL=transducers.js.map