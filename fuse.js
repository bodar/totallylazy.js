const { FuseBox } = require("fuse-box");
const fuse = FuseBox.init({
    homeDir : "src",
    target : 'browser@es5',
    output : "dist/$name.js"
});
fuse.bundle("es5-bundle").instructions(" > api.ts");
