export interface Clock {
    now(): Date;
}
export declare class SystemClock implements Clock {
    now(): Date;
}
export declare class StoppedClock implements Clock {
    private value;
    constructor(value: Date);
    now(): Date;
}
