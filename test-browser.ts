import {FuseBox, WebIndexPlugin} from 'fuse-box';
import {task} from 'fuse-box/sparky';
import {File} from './src/files';
import {ServerHandler} from './src/http/node';
import {notFound, ok} from "./src/http";
import {launch} from 'puppeteer';
import {ByteBody} from "./src/http/bin";

task('default', ['test-browser']);

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


