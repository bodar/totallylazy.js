"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.File = void 0;
const tslib_1 = require("tslib");
const fs = require("fs");
const os = require("os");
const path = require("path");
const util_1 = require("util");
const lazy_1 = require("./lazy");
class File {
    constructor(pathOrName, parent = process.cwd()) {
        if (pathOrName.charAt(0) === '/') {
            this.absolutePath = pathOrName;
        }
        else {
            this.absolutePath = path.resolve(parent instanceof File ? parent.absolutePath : parent, pathOrName);
        }
    }
    get name() {
        return path.basename(this.absolutePath);
    }
    get url() {
        return `file://${this.absolutePath}`;
    }
    child(name) {
        return new File(name, this.absolutePath);
    }
    children() {
        return (0, tslib_1.__asyncGenerator)(this, arguments, function* children_1() {
            const names = yield (0, tslib_1.__await)((0, util_1.promisify)(fs.readdir)(this.absolutePath));
            yield (0, tslib_1.__await)(yield* (0, tslib_1.__asyncDelegator)((0, tslib_1.__asyncValues)(names.map(name => this.child(name)))));
        });
    }
    get isDirectory() {
        return this.stats.then(stat => stat.isDirectory());
    }
    get exists() {
        return this.stats.then(ignore => true, ignore => false);
    }
    get stats() {
        return (0, util_1.promisify)(fs.lstat)(this.absolutePath);
    }
    descendants() {
        return (0, tslib_1.__asyncGenerator)(this, arguments, function* descendants_1() {
            var e_1, _a;
            try {
                for (var _b = (0, tslib_1.__asyncValues)(this.children()), _c; _c = yield (0, tslib_1.__await)(_b.next()), !_c.done;) {
                    const child = _c.value;
                    if (yield (0, tslib_1.__await)(child.isDirectory))
                        yield (0, tslib_1.__await)(yield* (0, tslib_1.__asyncDelegator)((0, tslib_1.__asyncValues)(child.descendants())));
                    yield yield (0, tslib_1.__await)(child);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield (0, tslib_1.__await)(_a.call(_b));
                }
                finally { if (e_1) throw e_1.error; }
            }
        });
    }
    bytes() {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            return yield (0, util_1.promisify)(fs.readFile)(this.absolutePath);
        });
    }
    content(newContent) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            if (newContent) {
                (yield (0, util_1.promisify)(fs.writeFile)(this.absolutePath, newContent));
                return newContent;
            }
            return (yield (0, util_1.promisify)(fs.readFile)(this.absolutePath, 'utf-8')).toString();
        });
    }
    read(options) {
        return fs.createReadStream(this.absolutePath, options);
    }
    append(data, options) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            return yield (0, util_1.promisify)(fs.appendFile)(this.absolutePath, data, options);
        });
    }
    write(options) {
        return fs.createWriteStream(this.absolutePath, options);
    }
    mkdir() {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            if (!(yield this.exists))
                yield (0, util_1.promisify)(fs.mkdir)(this.absolutePath);
            return this;
        });
    }
    delete() {
        var e_2, _a;
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            if (!(yield this.exists))
                return Promise.resolve();
            if (yield this.isDirectory) {
                try {
                    for (var _b = (0, tslib_1.__asyncValues)(this.descendants()), _c; _c = yield _b.next(), !_c.done;) {
                        const descendant = _c.value;
                        yield descendant.delete();
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                return yield (0, util_1.promisify)(fs.rmdir)(this.absolutePath);
            }
            return yield (0, util_1.promisify)(fs.unlink)(this.absolutePath);
        });
    }
    copy(destination, flags) {
        var e_3, _a;
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            destination = destination instanceof File ? destination : new File(destination);
            if (yield this.isDirectory) {
                const dest = yield destination.child(this.name).mkdir();
                try {
                    for (var _b = (0, tslib_1.__asyncValues)(this.descendants()), _c; _c = yield _b.next(), !_c.done;) {
                        const descendant = _c.value;
                        yield descendant.copy(dest, flags);
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
            }
            else {
                if (yield destination.isDirectory)
                    destination = destination.child(this.name);
                return yield (0, util_1.promisify)(fs.copyFile)(this.absolutePath, destination.absolutePath, flags);
            }
        });
    }
}
File.workingDirectory = new File(process.cwd());
File.tempDirectory = new File(os.tmpdir());
(0, tslib_1.__decorate)([
    lazy_1.lazy
], File.prototype, "name", null);
(0, tslib_1.__decorate)([
    lazy_1.lazy
], File.prototype, "url", null);
exports.File = File;
//# sourceMappingURL=files.js.map