
interface InvocationHandler {
    invoke(proxy:any, method:String, args:any[]): any;
}

let invocation:[string, any[]];

class Call<T, R> implements InvocationHandler {
    invoke(proxy: any, method: String, args: any[]): any {
        return undefined;
    }
}

export function method<T,S>(value:S): any  {
    return invocation;
}

export function on<T>(instance: new ()=> T): T {
    return new Proxy(instance, {
        get(target:object, name:string, receiver:any){
            return (...args:any[]) => {
                invocation = [name, args];
                return receiver;
            };
        }
    }) as any;
}
