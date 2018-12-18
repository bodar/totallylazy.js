import {Mapper} from "./collections";

export type Predicate<A> = (a: A) => boolean;

export function not<A>(predicate: Predicate<A>): Predicate<A> {
    return (a: A) => !predicate(a);
}

export interface Where<A, B> extends Predicate<A> {
    mapper: Mapper<A,B>,
    predicate: Predicate<B>
}

export function where<A, B>(mapper: Mapper<A, B>, predicate: Predicate<B>): Where<A, B> {
    return Object.assign((a: A) => predicate(mapper(a)), {
        mapper,
        predicate
    });
}