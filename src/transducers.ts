if (typeof Symbol.asyncIterator == 'undefined') {
    (Symbol as any).asyncIterator = Symbol.for("Symbol.asyncIterator");
}

export abstract class Transducer<A, B> {
    abstract async_(iterable: AsyncIterable<A>): AsyncIterable<B>;

    abstract sync(iterable: Iterable<A>): Iterable<B>;

    compose<C>(other: Transducer<B, C>): Transducer<A, C> {
        return compose(other, this);
    }

    map<C>(mapper: Mapper<B, C>): Transducer<A, C> {
        return map(mapper, this);
    }

    filter(predicate: Predicate<B>): Transducer<A, B> {
        return filter(predicate, this);
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
}

export class IdentityTransducer<A> extends Transducer<A, A> {
    async_(iterator: AsyncIterable<A>): AsyncIterable<A> {
        return iterator;
    }

    sync(iterator: Iterable<A>): Iterable<A> {
        return iterator;
    }
}

export function identity<A>(): IdentityTransducer<A> {
    return new IdentityTransducer()
}

// alias
export function transducer<A>(): IdentityTransducer<A> {
    return identity()
}

export type Mapper<A, B> = (a: A) => B;

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

export type Predicate<A> = (a: A) => boolean;

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

export function asyncIterable<A>(iterator: AsyncIterator<A>): AsyncIterable<A> {
    return {
        [Symbol.asyncIterator](): AsyncIterator<A> {
            return iterator;
        }
    };
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

export interface Reducer<A, B> {
    call(accumilator: B, instance: A): B;

    identity(): B;
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

export class Sum implements Reducer<number, number> {
    call(a: number, b: number): number {
        return a + b;
    }

    identity(): number {
        return 0;
    }
}

export const sum = new Sum();

export function* iterable<T>(...t: T[]): Iterable<T> {
    yield* t;
}

export async function asyncArray<T>(iterable: AsyncIterable<T>): Promise<T[]> {
    const result: T[] = [];
    for await (const value of iterable) result.push(value);
    return result;
}

export function syncArray<T>(iterable: Iterable<T>): T[] {
    return [...iterable];
}


export function* iterate<T>(generator: (t: T) => T, value: T): Iterable<T> {
    while (true) {
        yield value;
        value = generator(value);
    }
}

export function* repeat<T>(generator: () => T): Iterable<T> {
    while (true) {
        yield generator();
    }
}

export function increment(a: number): number {
    return a + 1;
}

export function add(a: number, b: number): number {
    return a + b;
}

export function* range(start: number): Iterable<number> {
    yield* iterate(increment, start);
}

export async function* async_<T>(iterable: Iterable<T>): AsyncIterable<T> {
    yield* iterable;
}

// TODO
// export async function* range(start:number, end:number): AsyncIterable<number> {
//     if (end < start) yield* range(start, end, -1);
//     yield* range(start).takeWhile(n => n <=end);
// }
//
// export async function* range(final int start, final int end, final int step): AsyncIterable<number> {
//     if (end < start) yield* iterate(add(step), start).takeWhile(n => n >=end);
//     yield* iterate(add(step), start).takeWhile(n => n <=end);
// }

