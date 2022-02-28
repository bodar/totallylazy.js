"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = exports.identity = void 0;
function identity() {
    return (instance) => instance;
}
exports.identity = identity;
function get(fun, defaultResult = undefined) {
    try {
        const result = fun();
        if (typeof result == 'undefined')
            return defaultResult;
        return result;
    }
    catch (e) {
        return defaultResult;
    }
}
exports.get = get;
//# sourceMappingURL=functions.js.map