export declare function replace<T extends {}, K extends keyof T>(object: T, key: K, value: T[K]): T;
export declare function lazy(target: any, name: string, descriptor: PropertyDescriptor): any;
export declare function container<C>(activators: Activators<C>): C;
export declare type Activator<C, T> = (c: C) => T;
export declare type Activators<C> = {
    [P in keyof C]: Activator<C, C[P]>;
};
