import {Predicate} from "../predicates";
import {FilterTransducer} from "./filter";

export function reject<A>(predicate: Predicate<A>): FilterTransducer<A> {
    return new FilterTransducer(a => !predicate(a));
}