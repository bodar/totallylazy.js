import {FuseBox, WebIndexPlugin} from 'fuse-box';
import {src, task, tsc} from 'fuse-box/sparky';
import * as Mocha from 'mocha';
import {File} from './src/totallylazy/files';
import {NodeServerHandler} from './src/node/server';
import runner = require('mocha-headless-chrome');
import {notFound, ok, Uri} from "./src/api";


task('default', ['clean', 'compile', 'test', 'bundle', 'test-browser']);

task('clean', async () => {
    await src('./dist').clean('dist/').exec();
});

task('compile', async () => {
    await tsc('.', {});
});

task('test', async () => {
    const mocha = new Mocha();
    for await (const source of new File('src').descendants()) {
        if (source.name.endsWith('.test.js')) {
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

task('test-browser', async () => {
    const server = new NodeServerHandler({
        handle: async (request) => {
            const path = '.' + request.uri.path;
            try {
                let content = await new File(path).content();
                return ok({"Content-Length": String(content.length)}, content);
            } catch (e) {
                return notFound({"Content-Length": String(e.toString().length)}, e.toString());
            }
        }
    });

    try {
        const url = await server.url() + 'dist/mocha.html';

        console.log(url);

        return runner({
            file: url,
            reporter: 'dot',
            visible: true,
        });
    } finally {
        // await server.close();
    }
});
