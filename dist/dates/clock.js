"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoppedClock = exports.SystemClock = void 0;
class SystemClock {
    now() {
        return new Date();
    }
}
exports.SystemClock = SystemClock;
class StoppedClock {
    constructor(value) {
        this.value = value;
    }
    now() {
        return this.value;
    }
}
exports.StoppedClock = StoppedClock;
//# sourceMappingURL=clock.js.map