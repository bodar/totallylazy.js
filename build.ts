import {FuseBox, WebIndexPlugin} from 'fuse-box';
import {src, task, context} from 'fuse-box/sparky';

task('default', ['clean', 'build']);

task('clean', async () => {
    await src('./dist').clean('dist/').exec();
});

task('build', async () => {
    let fuse = FuseBox.init({
        homeDir: 'src',
        target: 'browser@es5',
        output : "dist/$name.js",
        sourceMaps: true,
        plugins: [
            WebIndexPlugin({
                path: '.',
                template: 'src/mocha.html',
                target: 'mocha.html'
            })
        ]
    });
    fuse.bundle("tests", "> **/*.test.ts");
    fuse.run();
});