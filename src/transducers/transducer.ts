export interface Transducer<A, B> {
    sync(iterable: Iterable<A>): Iterable<B>;

    async_(iterable: AsyncIterable<A>): AsyncIterable<B>;
}