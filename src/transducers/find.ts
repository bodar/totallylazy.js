import {Predicate} from "../predicates";
import {filter} from "./filter";
import {first} from "./first";
import {compose} from "./compose";
import {Transducer} from "./transducer";

export function find<A>(predicate: Predicate<A>): Transducer<A, A> {
    return compose(filter(predicate), first());
}