import {map, Transducer} from "./transducers";
import {single} from "./collections";

export interface Result<I, O> {
    value: O;
    remainder: ReadonlyArray<I>;
}

export function isResult(value: any): value is Result<any, any> {
    return typeof value === "object" &&
        'value' in value &&
        'remainder' in value;
}

export interface Combinator<I, O> {
    parse(input: ReadonlyArray<I>): Result<I, O>;
}

export function transduce<I, A, B>(a: Result<I, A>, b: Transducer<A, B>): Result<I, B>;
export function transduce<I, A, B, C>(a: Result<I, A>, b: Transducer<A, B>, c: Transducer<B, C>): Result<I, C>;
export function transduce<I, A, B, C, D>(a: Result<I, A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>): Result<I, D>;
export function transduce<I, A, B, C, D, E>(a: Result<I, A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>): Result<I, E>;
export function transduce<I, A, B, C, D, E, F>(a: Result<I, A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>, f: Transducer<E, F>): Result<I, F>;

export function transduce<I, A, B>(a: Combinator<I, A>, b: Transducer<A, B>): Combinator<I, B>;
export function transduce<I, A, B, C>(a: Combinator<I, A>, b: Transducer<A, B>, c: Transducer<B, C>): Combinator<I, C>;
export function transduce<I, A, B, C, D>(a: Combinator<I, A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>): Combinator<I, D>;
export function transduce<I, A, B, C, D, E>(a: Combinator<I, A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>): Combinator<I, E>;
export function transduce<I, A, B, C, D, E, F>(a: Combinator<I, A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>, f: Transducer<E, F>): Combinator<I, F>;

export function transduce<I>(source: Combinator<I, any> | Result<I, any>, ...transducers: Transducer<any, any>[]): Combinator<I, any> | Result<I, any> {
    if (isResult(source)) return new TransducedResult(source, transducers);
    return new TransducedCombinator(source, transducers);
}

export class TransducedResult<I, O> implements Result<I, O> {
    constructor(public source: Result<any, any>, public transducers: Transducer<any, any>[]) {
    }

    get value() {
        // @ts-ignore
        return single([this.source.value], ...this.transducers);
    }

    get remainder() {
        return this.source.remainder;
    }
}

export class TransducedCombinator<I, O> implements Combinator<I, O> {
    constructor(public source: Combinator<any, any>, public transducers: Transducer<any, any>[]) {
    }

    parse(values: ReadonlyArray<I>): Result<I, O> {
        return new TransducedResult<I, O>(this.source.parse(values), this.transducers);
    }
}

export function is<A>(a: A): Combinator<A, A> {
    return new IsCombinator(a);
}

export class IsCombinator<A> implements Combinator<A, A> {
    constructor(private expected: A) {
    }

    parse(input: ReadonlyArray<A>): Result<A, A> {
        const [actual, ...remainder] = input;
        if (actual === this.expected) return {value: actual, remainder};
        throw new AssertionError(actual, this.expected);
    }
}

export class AssertionError extends Error {
    constructor(public actual: any, public expected: any, public showDiff = true) {
        super(`Failed to parse '${actual}' expected '${expected}'`);
    }
}

export function values<A>(a: ReadonlyArray<A>): Combinator<A, ReadonlyArray<A>> {
    return new Values(a);
}

export class Values<A> implements Combinator<A, ReadonlyArray<A>> {
    constructor(private values: ReadonlyArray<A>) {
    }

    parse(input: ReadonlyArray<A>): Result<A, ReadonlyArray<A>> {
        if (input.length < this.values.length) throw new AssertionError(input, this.values);
        for (let i = 0; i < this.values.length; i++) {
            const expected = this.values[i];
            const actual = input[i];
            if (expected !== actual) throw new AssertionError(actual, expected);
        }
        const remainder = input.slice(this.values.length);
        return {value: this.values, remainder};
    }
}

export class TupleCombinator<I> implements Combinator<I, any> {
    constructor(public combinators: Combinator<any, any>[]) {
    }

    parse(input: ReadonlyArray<I>): Result<I, any> {
        return this.combinators.reduce((a, c) => {
            const result = c.parse(a.remainder);
            return {value: [...a.value, result.value], remainder: result.remainder} as Result<I, any>;
        }, {value: [], remainder: input} as Result<I, any>);
    }
}

export function tuple<I, A, B>(a: Combinator<I, A>, b: Combinator<I, B>): Combinator<I, [A, B]>;
export function tuple<I, A, B, C>(a: Combinator<I, A>, b: Combinator<I, B>, c: Combinator<I, C>): Combinator<I, [A, B, C]>;
export function tuple<I, A, B, C, D>(a: Combinator<I, A>, b: Combinator<I, B>, c: Combinator<I, C>, d: Combinator<I, D>): Combinator<I, [A, B, C, D]>;
export function tuple<I, A, B, C, D, E>(a: Combinator<I, A>, b: Combinator<I, B>, c: Combinator<I, C>, d: Combinator<I, D>, e: Combinator<I, E>): Combinator<I, [A, B, C, D, E]>;
export function tuple<I, A, B, C, D, E, F>(a: Combinator<I, A>, b: Combinator<I, B>, c: Combinator<I, C>, d: Combinator<I, D>, e: Combinator<I, E>, f: Combinator<I, F>): Combinator<I, [A, B, C, D, E, F]>;


export function tuple<I>(...combinator: Combinator<I, any>[]): Combinator<I, any> {
    return new TupleCombinator(combinator);
}

export type Step<I, A, B> = (a: Combinator<I, A>) => Combinator<I, B>

export function then<I, A, B>(b: Combinator<I, B>): (a: Combinator<I, A>) => Combinator<I, [A, B]> {
    return (a: Combinator<I, A>) => tuple(a, b);
}

export function followedBy<I, A>(b: Combinator<I, any>): (a: Combinator<I, A>) => Combinator<I, A> {
    return (a: Combinator<I, A>) => transduce(tuple(a, b), map<[A, any], A>(([a]) => a));
}

export class Combine<I> implements Combinator<I, any> {
    constructor(public combinator: Combinator<I, any>, public steps: Step<I, any, any>[]) {
    }

    parse(input: ReadonlyArray<I>): Result<I, any> {
        return this.steps.reduce((a, s) => s(a),
            this.combinator).parse(input);
    }
}


export function combine<I, A, B>(a: Combinator<I, A>, b: Step<I, A, B>): Combinator<I, B>;
export function combine<I, A, B, C>(a: Combinator<I, A>, b: Step<I, A, B>, c: Step<I, B, C>): Combinator<I, C>;
export function combine<I, A, B, C, D>(a: Combinator<I, A>, b: Step<I, A, B>, c: Step<I, B, C>, d: Step<I, C, D>): Combinator<I, D>;
export function combine<I, A, B, C, D, E>(a: Combinator<I, A>, b: Step<I, A, B>, c: Step<I, B, C>, d: Step<I, C, D>, e: Step<I, D, E>): Combinator<I, E>;
export function combine<I, A, B, C, D, E, F>(a: Combinator<I, A>, b: Step<I, A, B>, c: Step<I, B, C>, d: Step<I, C, D>, e: Step<I, D, E>, f: Step<I, E, F>): Combinator<I, F>;
export function combine<I>(combinator: Combinator<I, any>, ...steps: Step<I, any, any>[]): Combinator<I, any> {
    return new Combine(combinator, steps);
}