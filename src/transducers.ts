export interface AsyncTransducer<A, B> {
    call(iterator: AsyncIterator<A>): AsyncIterator<B>;
}

export abstract class AsyncTransducerBase<A, B> implements AsyncTransducer<A, B>{
    abstract call<A,B>(iterator: AsyncIterator<A>): AsyncIterator<B>;
}

export class MapAsyncTransducer<A,B> implements AsyncTransducer<A, B>{
    constructor(public mapper:(a:A) => B){}

    call(iterator: AsyncIterator<A>): AsyncIterator<B> {
        const self = this;
        return {
            next(): Promise<IteratorResult<B>>{
                return iterator.next().then(result => {
                    if(result.done) return result as any;
                    return {value: self.mapper(result.value), done:false};
                });
            }
        };
    }
}

export class AsyncTransducers {
    identity<A>(): AsyncTransducerBase<A, A> {
        return (receiver: AsyncIterator<A>) => receiver;
    }
}