import {FuseBox, WebIndexPlugin} from 'fuse-box';
import {src, task, tsc} from 'fuse-box/sparky';
import * as Mocha from 'mocha';
import {Path} from './src/totallylazy/files';

task('default', ['clean', 'compile', 'test',  'bundle']);

task('clean', async () => {
    await src('./dist').clean('dist/').exec();
});

task('compile', async () => {
    await tsc('.', {});
});

task('test', async () => {
    const mocha = new Mocha();
    for await (const source of new Path('src').descendants()) {
        if(source.name.endsWith('.test.js')) {
            mocha.addFile(source.absolutePath);
        }
    }
    await new Promise((resolved, rejected) => mocha.run(failures => failures == 0 ? resolved() : rejected("Tests failed " + failures)));
});

task('bundle', async () => {
    let fuse = FuseBox.init({
        homeDir: 'src',
        target: 'browser@es5',
        output: "dist/$name.js",
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
    await fuse.run();
});