"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.where = exports.not = void 0;
function not(predicate) {
    return (a) => !predicate(a);
}
exports.not = not;
function where(mapper, predicate) {
    return Object.assign((a) => predicate(mapper(a)), {
        mapper,
        predicate
    });
}
exports.where = where;
//# sourceMappingURL=predicates.js.map