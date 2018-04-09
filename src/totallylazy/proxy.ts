
let invocation:any[];

export function call<T,S>(value:S): any  {
    return invocation;
}

export function on<T>(instance: new ()=> T): T {
    invocation = [];
    return new Proxy(instance, {
        get(target:object, name:string, receiver:any){
            invocation.push(name);
            return receiver;
        },
        apply(target:object, thisArg:any, args:any[]){
            invocation.push(args);
            return target;
        }
    }) as any;
}
