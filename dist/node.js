"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runningInNode = void 0;
function runningInNode() {
    return (typeof process !== 'undefined') && (typeof process.versions.node !== 'undefined');
}
exports.runningInNode = runningInNode;
//# sourceMappingURL=node.js.map