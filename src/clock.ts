export interface Clock {
    now(): Date
}

export class SystemClock implements Clock {
    now(): Date {
        return new Date();
    }
}

export class StoppedClock implements Clock {
    constructor(private value: Date) {
    }

    now(): Date {
        return this.value;
    }
}