import {FuseBox, WebIndexPlugin} from 'fuse-box';
import {bumpVersion, npmPublish, task, tsc} from 'fuse-box/sparky';
import * as Mocha from 'mocha';
import {File} from './src/files';
import {ServerHandler} from './src/http/node';
import {notFound, ok} from "./src/http";
import * as puppeteer from 'puppeteer';
import {ByteBody} from "./src/http/httpbin";


const src = new File('src');
const dist = new File("dist");

task('default', ['clean', 'compile', 'test', 'bundle', 'test-browser']);

task('clean', async () => {
    await dist.delete();
    await dist.mkdir();
    for await (const source of src.descendants()) {
        if (source.name.endsWith('.js') || source.name.endsWith('.js.map')) {
            source.delete();
        }
    }
});

task('compile', async () => {
    await tsc('.', {});
});

task('test', async () => {
    const mocha = new Mocha();
    for await (const source of src.descendants()) {
        if (source.name.endsWith('.test.js')) {
            mocha.addFile(source.absolutePath);
        }
    }
    await new Promise((resolved, rejected) => mocha.reporter('spec').run(failures => failures == 0 ? resolved() : rejected("Tests failed " + failures)));
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
    const server = new ServerHandler({
        handle: async (request) => {
            const path = '.' + request.uri.path;
            try {
                let content = await new File(path).bytes();
                return ok({"Content-Length": String(content.length)}, new ByteBody(content));
            } catch (e) {
                return notFound({"Content-Length": String(e.toString().length)}, e.toString());
            }
        }
    });

    const browser = await puppeteer.launch({headless: true});

    try {
        const page = await browser.newPage();

        page.on("console", (message: any) => {
            (async () => {
                const args = await Promise.all(message.args().map(a => a.jsonValue()));
                console[message.type()](...args);
            })();
        });

        const url = await server.url() + 'dist/mocha.html';
        await page.goto(url, {waitUntil: 'load'});

        return await page.evaluate(() => {
            return new Promise((resolved: Function, rejected: Function) => {
                mocha.reporter('spec').run(failures => failures == 0 ? resolved("SUCCESS") : rejected("FAILED: " + failures))
            });
        });

    } finally {
        await browser.close();
        await server.close();
    }
});

task('package', async () => {
    bumpVersion('package.json', {type: 'patch'});
    for await(const name of ['package.json', 'README.md', 'LICENSE']){
        await new File(name).copy(dist);
    }
    for await (const source of src.descendants()) {
        await source.copy(dist);
    }
});

task('release', async () => {
    //const npmrc = new File('.npmrc');
    //npmrc.append(`//registry.npmjs.org/:_authToken=${process.env.NPM_TOKEN}\n`);
    npmPublish({path: 'dist'});
});

task('ci', ['default', 'package', 'release']);

