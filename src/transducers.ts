if (typeof Symbol.asyncIterator == 'undefined') {
    (Symbol as any).asyncIterator = Symbol.for("Symbol.asyncIterator");
}

export abstract class Transducer<A, B> {
    abstract apply(iterable: AsyncIterable<A>): AsyncIterable<B>;

    call(...values: A[]): AsyncIterable<B> {
        return this.apply(toIterable(...values));
    }

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

    scan<C>(reducer: Reducer<B, C>): Transducer<A, C> {
        return scan(reducer, this);
    }
}

export class IdentityTransducer<A> extends Transducer<A, A> {
    apply(iterator: AsyncIterable<A>): AsyncIterable<A> {
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

    apply(iterable: AsyncIterable<A>): AsyncIterable<B> {
        const self = this;
        const iterator = iterable[Symbol.asyncIterator]();
        return asyncIterable({
            next(): Promise<IteratorResult<B>> {
                return iterator.next().then(result => {
                    if (result.done) return result as any;
                    return {value: self.mapper(result.value), done: false};
                });
            }
        });
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

    apply(iterable: AsyncIterable<A>): AsyncIterable<A> {
        const self = this;
        const iterator = iterable[Symbol.asyncIterator]();
        return asyncIterable({
            next(): Promise<IteratorResult<A>> {
                return iterator.next().then(result => {
                    if (result.done) return result as any;
                    if (self.predicate(result.value)) return {value: result.value, done: false};
                    return this.next();
                });
            }
        });
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

    apply(iterator: AsyncIterable<A>): AsyncIterable<C> {
        return this.b.apply(this.a.apply(iterator));
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

    apply(iterable: AsyncIterable<A>): AsyncIterable<B> {
        const self = this;
        const iterator = iterable[Symbol.asyncIterator]();
        return asyncIterable({
            next(): Promise<IteratorResult<B>> {
                return iterator.next().then(result => {
                    if (result.done) return result as any;
                    self.accumilator = self.reducer.call(self.accumilator, result.value);
                    return {value: self.accumilator, done: false};
                })
            }
        });
    }
}

export function scan<A, B, C>(reducer: Reducer<B, C>, transducer: Transducer<A, B>): Transducer<A, C> {
    return compose(new ScanTransducer(reducer), transducer);
}

export class TakeTransducer<A> extends Transducer<A, A> {
    constructor(public count: number) {
        super();
    }

    apply(iterable: AsyncIterable<A>): AsyncIterable<A> {
        const self = this;
        const iterator = iterable[Symbol.asyncIterator]();
        return asyncIterable({
            next(): Promise<IteratorResult<A>> {
                if(self.count == 0) return Promise.resolve({done: true} as IteratorResult<A>);
                return iterator.next().then(result => {
                    self.count--;
                    return result;
                })
            }
        });
    }
}

export function take<A, B>(count:number, transducer: Transducer<A, B>): Transducer<A, B> {
    return compose(new TakeTransducer(count), transducer);
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

export async function* toIterable<T>(...t: T[]): AsyncIterable<T> {
    yield* t;
}

export async function toArray<T>(iterable: AsyncIterable<T>): Promise<T[]> {
    const result: T[] = [];
    for await (const value of iterable) result.push(value);
    return result;
}

export async function* iterate<T>(generator: (t:T) => T, value: T): AsyncIterable<T> {
    while (true){
        yield value;
        value = generator(value);
    }
}

export async function* repeat<T>(generator: () => T): AsyncIterable<T> {
    while (true){
        yield generator();
    }
}

export function increment(a:number):number {
    return a + 1;
}

export function add(a:number, b:number):number {
    return a + b;
}

export async function* range(start:number): AsyncIterable<number>{
    yield* iterate(increment, start);
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

