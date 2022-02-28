"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const child_process_1 = require("child_process");
const collections_1 = require("./collections");
function run(options) {
    const handler = new collections_1.AsyncIteratorHandler();
    const process = (0, child_process_1.spawn)(options.command, options.arguments || [], Object.assign(Object.assign({}, options), { stdio: ['ignore', 'pipe', 'pipe'] }));
    process.stdout.on('data', (data) => handler.value(data.toString()));
    process.stderr.on('data', (data) => handler.value(data.toString()));
    process.on('error', e => handler.error(e));
    process.on('close', (code) => {
        if (code === 0) {
            handler.close();
        }
        else {
            handler.error(Object.assign(new Error(`Command ${options.command} returned exit code ${code}`), { code }));
        }
    });
    return handler;
}
exports.run = run;
//# sourceMappingURL=run.js.map