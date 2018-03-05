import {FuseBox, WebIndexPlugin} from 'fuse-box';
import {src, task, context, tsc} from 'fuse-box/sparky';
import * as Mocha from 'mocha';
import * as fs from 'fs';
import * as path from 'path';
import {promisify} from 'util';

task('default', ['clean', 'compile', 'test',  'bundle']);

task('clean', async () => {
    await src('./dist').clean('dist/').exec();
});

task('compile', async () => {
    await tsc('.', {});
});

task('test', async () => {
    const mocha = new Mocha();
    const src = await promisify(fs.readdir)('src');
    let test = '.test.js';
    src.filter(file => file.substr(-test.length) === test).forEach(file => mocha.addFile(path.join('src', file)));
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