import {FuseBox, WebIndexPlugin} from 'fuse-box';
import {npmPublish, task, tsc} from 'fuse-box/sparky';
import * as Mocha from 'mocha';
import {File} from './src/files';
import {ServerHandler} from './src/http/node';
import {notFound, ok} from "./src/http";
import {launch} from 'puppeteer';
import {ByteBody} from "./src/http/bin";


const src = new File('src');
const test = new File('test');
const dist = new File("dist");

const npm_token = process.env.NPM_TOKEN;
const version = process.env.VERSION;
const tag = process.env.TAG;

task('default', ['clean', 'tests']);

task('tests', ['&test', '&test-browser']);

task('clean', async () => {
    await dist.delete();
    await dist.mkdir();
    for await (const source of src.descendants()) {
        if (source.name.endsWith('.js') || source.name.endsWith('.js.map')) {
            source.delete();
        }
    }
    for await (const source of test.descendants()) {
        if (source.name.endsWith('.js') || source.name.endsWith('.js.map')) {
            source.delete();
        }
    }
});

task('compile', async () => {
    await tsc('.', {});
});

task('test', ['compile'], async () => {
    const mocha = new Mocha();
    for await (const source of test.descendants()) {
        if (source.name.endsWith('.test.js')) {
            mocha.addFile(source.absolutePath);
        }
    }
    await new Promise((resolved, rejected) => mocha.reporter('spec').run(failures => failures == 0 ? resolved() : rejected("Tests failed " + failures)));
});

task('bundle', async () => {
    let fuse = FuseBox.init({
        homeDir: '.',
        target: 'browser@es5',
        output: "dist/$name.js",
        sourceMaps: true,
        plugins: [
            WebIndexPlugin({
                path: '.',
                template: 'test/mocha.html',
                target: 'mocha.html'
            })
        ]
    });
    fuse.bundle("tests", "> test/**/*.test.ts");
    await fuse.run();
});

task('test-browser', ['bundle'], async () => {
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

    const browser = await launch({headless: true});

    try {
        const page = await browser.newPage();

        page.on("console", (message) => {
            (async () => {
                const args = await Promise.all(message.args().map(a => a.jsonValue()));
                (console as any)[message.type()](...args);
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

async function updateVersion() {
    const file = new File('package.json');
    const data = JSON.parse(await file.content());
    data.version = version;
    await dist.child('package.json').append(JSON.stringify(data));
}

task('package', async () => {
    await updateVersion();

    for await(const name of ['README.md', 'LICENSE']) {
        await new File(name).copy(dist);
    }
    for await (const source of src.descendants()) {
        await source.copy(dist);
    }
});

task('release', async () => {
    await dist.child('.npmrc').append(`@bodar:registry=https://registry.npmjs.org\n//registry.npmjs.org/:_authToken=${npm_token}\n`);
    await npmPublish({path: 'dist', tag});
});

task('ci', ['default', 'package', 'release']);

