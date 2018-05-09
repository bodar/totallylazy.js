import {Reducer} from "./collections";

export function increment(a: number): number {
    return a + 1;
}

export function add(a: number): (b: number) => number;
export function add(a: number, b: number): number;
export function add(a: number, b?: number) {
    if (b === undefined) return (b: number) => a + b;
    else return a + b;
}

export function subtract(a: number): (b: number) => number;
export function subtract(a: number, b: number): number;
export function subtract(a: number, b?: number) {
    if (b === undefined) return (b: number) => b - a;
    else return a - b;
}

export class Sum implements Reducer<number, number> {
    call(a: number, b: number): number {
        return a + b;
    }

    identity(): number {
        return 0;
    }
}

export const sum = new Sum();