import {Reducer} from "../collections";
import {Transducer} from "./transducer";
import {compose} from "./compose";
import {last} from "./last";
import {scan} from "./scan";

export function reduce<A, B>(reducer: Reducer<A, B>, seed: B): Transducer<A, B> {
    return compose(scan(reducer, seed), last());
}