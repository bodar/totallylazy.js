import {FuseBox, WebIndexPlugin} from 'fuse-box';
import {src, task, tsc} from 'fuse-box/sparky';
import * as Mocha from 'mocha';
import {File} from './src/totallylazy/files';
import {NodeServerHandler} from './src/node/server';
import * as puppeteer from 'puppeteer';
import {ok, Uri} from "./src/api";


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
            let content = await new File(path).content();
            return ok({"Content-Length": String(content.length)}, content);
        }
    });
    const browser = await puppeteer.launch();

    try {
        let page = await browser.newPage();
        page.on("console", (message: any) => {
            console.log(message.text());
        });

        const url = await server.url() + 'dist/mocha.html';
        await page.goto(url, {waitUntil: 'load'});

        const result = await page.evaluate(() => {
            console.log("SCRIPTS: " + document.getElementsByTagName("script").length);
            const handle = (resolved:Function, rejected:Function) => {
                if(typeof mocha === 'undefined'){
                    console.log("UNDEFINED");
                    setTimeout(handle, 5, resolved, rejected);
                } else {
                    console.log("DEFINED: " + mocha);
                    mocha.run(failures => failures == 0 ? resolved("SUCCESS") : rejected("FAILED: " + failures))
                }
            };
            return new Promise(handle);
        });

        console.log(result);

        await page.screenshot({path: 'mocha.png'});

        return result

    } finally {
        await browser.close();
        await server.close();
    }
});
