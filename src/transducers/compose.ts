import {Transducer} from "./transducer";

export class CompositeTransducer<A, B, C> implements Transducer<A, C> {
    constructor(public a: Transducer<A, B>, public b: Transducer<B, C>) {
    }

    async_(iterator: AsyncIterable<A>): AsyncIterable<C> {
        return this.b.async_(this.a.async_(iterator));
    }

    sync(iterator: Iterable<A>): Iterable<C> {
        return this.b.sync(this.a.sync(iterator));
    }
}

export function compose<A, B, C>(a: Transducer<A, B>, b: Transducer<B, C>): CompositeTransducer<A, B, C> {
    return new CompositeTransducer(a, b);
}

