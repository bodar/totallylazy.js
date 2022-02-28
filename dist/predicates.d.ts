import { Mapper } from "./collections";
export declare type Predicate<A> = (a: A) => boolean;
export declare function not<A>(predicate: Predicate<A>): Predicate<A>;
export interface Where<A, B> extends Predicate<A> {
    mapper: Mapper<A, B>;
    predicate: Predicate<B>;
}
export declare function where<A, B>(mapper: Mapper<A, B>, predicate: Predicate<B>): Where<A, B>;
