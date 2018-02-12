import {FuseBox} from "fuse-box";
import {src, task, context} from 'fuse-box/sparky';

context(() => FuseBox.init({
    homeDir: "src",
    target: 'server@esnext',
    output: "dist/$name.js"
}));

task('default', ['clean']);

task('clean', async () => {
    await src('./dist').clean('dist/').exec();
});
