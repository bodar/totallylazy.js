import {Contract, isAsyncIterable, isIterable, isPromiseLike, Mapper, Predicate, Reducer} from "./collections";

export abstract class Transducer<A, B> implements Contract<B> {
    abstract sync(iterable: Iterable<A>): Iterable<B>;

    abstract async_(iterable: AsyncIterable<A>): AsyncIterable<B>;

    transduce(iterable: Iterable<A>): Iterable<B>;
    transduce(iterable: AsyncIterable<A>): AsyncIterable<B>;
    transduce(iterable: any) {
        if (isIterable(iterable)) return this.sync(iterable);
        if (isAsyncIterable(iterable)) return this.async_(iterable);
    }

    compose<C>(other: Transducer<B, C>): Transducer<A, C> {
        return compose(other, this);
    }

    decompose(): Iterable<Transducer<any, any>> {
        return decompose(this);
    }

    map<C>(mapper: Mapper<B, C>): Transducer<A, C> {
        return map(mapper, this);
    }

    flatMap<C>(mapper: Mapper<B, Contract<C>>): Transducer<A, C> {
        return flatMap(mapper, this);
    }

    filter(predicate: Predicate<B>): Transducer<A, B> {
        return filter(predicate, this);
    }

    find(predicate: Predicate<B>): Transducer<A, B> {
        return find(predicate, this);
    }

    first(): Transducer<A, B> {
        return first(this);
    }

    last(): Transducer<A, B> {
        return last(this);
    }

    take(count: number): Transducer<A, B> {
        return take(count, this);
    }

    takeWhile(predicate: Predicate<B>): Transducer<A, B> {
        return takeWhile(predicate, this);
    }

    scan<C>(reducer: Reducer<B, C>): Transducer<A, C> {
        return scan(reducer, this);
    }

    reduce<C>(reducer: Reducer<B, C>): Transducer<A, C> {
        return reduce(reducer, this);
    }
}

export abstract class Transducable<A> implements Contract<A> {
    protected constructor(public readonly transducer: Transducer<any, A> = identity()) {
    }

    abstract create<B>(transducer: Transducer<A, B>): Transducable<B>;

    decompose(): Iterable<Transducer<any, any>> {
        return this.transducer.decompose();
    }

    map<B>(mapper: Mapper<A, B>): Transducable<B> {
        return this.create(this.transducer.map(mapper));
    }

    flatMap<B>(mapper: Mapper<A, Transducable<B>>): Transducable<B> {
        return this.create(this.transducer.flatMap(mapper));
    }

    filter(predicate: Predicate<A>): Transducable<A> {
        return this.create(this.transducer.filter(predicate));
    }

    find(predicate: Predicate<A>): Transducable<A> {
        return this.create(this.transducer.find(predicate));
    }

    first(): Transducable<A> {
        return this.create(this.transducer.first());
    }

    last(): Transducable<A> {
        return this.create(this.transducer.first());
    }

    take(count: number): Transducable<A> {
        return this.create(this.transducer.take(count));
    }

    takeWhile(predicate: Predicate<A>): Transducable<A> {
        return this.create(this.transducer.takeWhile(predicate));
    }

    scan<B>(reducer: Reducer<A, B>): Transducable<B> {
        return this.create(this.transducer.scan(reducer));
    }

    reduce<B>(reducer: Reducer<A, B>): Transducable<B> {
        return this.create(this.transducer.reduce(reducer));
    }
}

export class IdentityTransducer<A> extends Transducer<A, A> {
    async_(iterable: AsyncIterable<A>): AsyncIterable<A> {
        return iterable;
    }

    sync(iterable: Iterable<A>): Iterable<A> {
        return iterable;
    }
}

export function identity<A>(): IdentityTransducer<A> {
    return new IdentityTransducer()
}

// alias
export function transducer<A>(): IdentityTransducer<A> {
    return identity()
}

export class FirstTransducer<A> extends Transducer<A, A> {
    async * async_(iterable: AsyncIterable<A>): AsyncIterable<A> {
        for await (const a of iterable) {
            yield a;
            return;
        }
    }

    * sync(iterable: Iterable<A>): Iterable<A> {
        for (const a of iterable) {
            yield a;
            return;
        }
    }
}

export function first<A, B>(transducer: Transducer<A, B>): Transducer<A, B> {
    return compose(new FirstTransducer(), transducer);
}

export class LastTransducer<A> extends Transducer<A, A> {
    async * async_(iterable: AsyncIterable<A>): AsyncIterable<A> {
        let last;
        for await (last of iterable) ;
        if (last !== undefined) yield last;
    }

    * sync(iterable: Iterable<A>): Iterable<A> {
        let last;
        for (last of iterable) ;
        if (last !== undefined) yield last;
    }
}

export function last<A, B>(transducer: Transducer<A, B>): Transducer<A, B> {
    return compose(new LastTransducer(), transducer);
}

export class MapTransducer<A, B> extends Transducer<A, B> {
    constructor(public mapper: Mapper<A, B>) {
        super();
    }

    async * async_(iterable: AsyncIterable<A>): AsyncIterable<B> {
        for await (const a of iterable) {
            yield this.mapper(a);
        }
    }

    * sync(iterable: Iterable<A>): Iterable<B> {
        for (const a of iterable) {
            yield this.mapper(a);
        }
    }
}

export function map<A, B, C>(mapper: Mapper<B, C>, transducer: Transducer<A, B>): Transducer<A, C> {
    return compose(new MapTransducer(mapper), transducer);
}

export class FlatMapTransducer<A, B> extends Transducer<A, B> {
    constructor(public mapper: Mapper<A, Contract<B>>) {
        super();
    }

    async * async_(iterable: AsyncIterable<A>): AsyncIterable<B> {
        for await (const a of iterable) {
            yield* this.mapper(a) as any as AsyncIterable<B>;
        }
    }

    * sync(iterable: Iterable<A>): Iterable<B> {
        for (const a of iterable) {
            yield* this.mapper(a) as any as Iterable<B>;
        }
    }
}

export function flatMap<A, B, C>(mapper: Mapper<B, Contract<C>>, transducer: Transducer<A, B>): Transducer<A, C> {
    return compose(new FlatMapTransducer(mapper), transducer);
}

export class FilterTransducer<A> extends Transducer<A, A> {
    constructor(public predicate: Predicate<A>) {
        super();
    }

    async * async_(iterable: AsyncIterable<A>): AsyncIterable<A> {
        for await (const a of iterable) {
            if (this.predicate(a)) yield a;
        }
    }

    * sync(iterable: Iterable<A>): Iterable<A> {
        for (const a of iterable) {
            if (this.predicate(a)) yield a;
        }
    }
}

export function filter<A, B>(predicate: Predicate<B>, transducer: Transducer<A, B>): Transducer<A, B> {
    return compose(new FilterTransducer(predicate), transducer);
}

export function find<A, B>(predicate: Predicate<B>, transducer: Transducer<A, B>): Transducer<A, B> {
    return first(filter(predicate, transducer));
}

export class CompositeTransducer<A, B, C> extends Transducer<A, C> {
    constructor(public a: Transducer<A, B>, public b: Transducer<B, C>) {
        super();
    }

    async_(iterator: AsyncIterable<A>): AsyncIterable<C> {
        return this.b.async_(this.a.async_(iterator));
    }

    sync(iterator: Iterable<A>): Iterable<C> {
        return this.b.sync(this.a.sync(iterator));
    }
}

export function compose<A, B, C>(b: Transducer<B, C>, a: Transducer<A, B>): CompositeTransducer<A, B, C> {
    return new CompositeTransducer(a, b);
}

export function* decompose(transducer: Transducer<any, any>): Iterable<Transducer<any, any>> {
    if (transducer instanceof CompositeTransducer) {
        yield* decompose(transducer.a);
        yield* decompose(transducer.b);
    } else {
        yield transducer;
    }
}

export class IntoArray<A> implements Reducer<A, A[]> {
    constructor(public seed: A[] = []) {
    }

    call(accumulator: A[], instance: A): A[] {
        accumulator.push(instance);
        return accumulator;
    }

    identity(): A[] {
        return this.seed;
    }
}

export function intoArray<A>(seed?: A[]) {
    return new IntoArray<A>(seed);
}

export class ScanTransducer<A, B> extends Transducer<A, B> {
    constructor(public reducer: Reducer<A, B>, public accumilator: B = reducer.identity()) {
        super();
    }

    async * async_(iterable: AsyncIterable<A>): AsyncIterable<B> {
        for await (const a of iterable) {
            yield this.accumilator = this.reducer.call(this.accumilator, a);
        }
    }

    * sync(iterable: Iterable<A>): Iterable<B> {
        for (const a of iterable) {
            yield this.accumilator = this.reducer.call(this.accumilator, a);
        }
    }
}

export function scan<A, B, C>(reducer: Reducer<B, C>, transducer: Transducer<A, B>): Transducer<A, C> {
    return compose(new ScanTransducer(reducer), transducer);
}

export function reduce<A, B, C>(reducer: Reducer<B, C>, transducer: Transducer<A, B>): Transducer<A, C> {
    return last(scan(reducer, transducer));
}

export class TakeTransducer<A> extends Transducer<A, A> {
    constructor(public count: number) {
        super();
    }

    async * async_(iterable: AsyncIterable<A>): AsyncIterable<A> {
        if (this.count == 0) return;
        for await (const a of iterable) {
            yield a;
            if ((--this.count) == 0) return;
        }
    }

    * sync(iterable: Iterable<A>): Iterable<A> {
        if (this.count == 0) return;
        for (const a of iterable) {
            yield a;
            if ((--this.count) == 0) return;
        }
    }
}

export function take<A, B>(count: number, transducer: Transducer<A, B>): Transducer<A, B> {
    return compose(new TakeTransducer(count), transducer);
}


export class TakeWhileTransducer<A> extends Transducer<A, A> {
    constructor(public predicate: Predicate<A>) {
        super();
    }

    async * async_(iterable: AsyncIterable<A>): AsyncIterable<A> {
        for await (const a of iterable) {
            if (this.predicate(a)) yield a;
            else return;
        }
    }

    * sync(iterable: Iterable<A>): Iterable<A> {
        for (const a of iterable) {
            if (this.predicate(a)) yield a;
            else return;
        }
    }
}

export function takeWhile<A, B>(predicate: Predicate<B>, transducer: Transducer<A, B>): Transducer<A, B> {
    return compose(new TakeWhileTransducer(predicate), transducer);
}



