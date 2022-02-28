import {Transducer} from "./transducer";
import {CompositeTransducer} from "./compose";

export function* decompose(transducer: Transducer<any, any>): Iterable<Transducer<any, any>> {
    if (transducer instanceof CompositeTransducer) {
        yield* decompose(transducer.a);
        yield* decompose(transducer.b);
    } else {
        yield transducer;
    }
}