let invocation: any[];

export function call<T, S>(value: S): any {
    return invocation;
}

export function on<T>(instance: new () => T): T {
    invocation = [];
    const proxy:Proxy = new Proxy(instance, {
        get(target: object, name: string, receiver: any) {
            invocation.push(name);
            return proxy;
        },
        set(target: object, name: string, value: any, receiver: any) {
            invocation.push(name, value);
            return proxy;
        },
        apply(target: object, thisArg: any, args: any[]) {
            invocation.push(args);
            return proxy;
        }
    });
    return proxy as any;
}
