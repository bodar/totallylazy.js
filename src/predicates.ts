export type Predicate<A> = (a: A) => boolean;

export interface Where<A, B> extends Predicate<A> {
    callable: (a: A) => B,
    predicate: Predicate<B>
}

export function where<A, B>(callable: (a: A) => B, predicate: Predicate<B>): Where<A, B> {
    return Object.assign((a: A) => predicate(callable(a)), {
        callable,
        predicate
    });
}