import {assert} from 'chai';
import {File} from './files';
import {runningInNode} from "./node";

describe("files", function () {
    before(function() {
        if (!runningInNode()) this.skip();
    });

    it('can return absolute path', function () {
        assert(new File('src').absolutePath.endsWith("http4js/src"));
    });

    it('can list children', async () => {
        for await (const child of new File('src').children()) {
            //TODO something sensible
        }
    });

    it('can tell if directory', async () => {
        assert(await new File('src').isDirectory);
    });

    it('can list descendants', async () => {
        for await (const child of new File('src').descendants()) {
            //TODO something sensible
        }
    });

    it('can get file content as bytes', async () => {
        const bytes:Uint8Array = await new File('build.ts').bytes();
        assert(bytes.length > 0);
    });

    it('can get file content as string', async () => {
        const content:string = await new File('build.ts').content();
        assert(content.length > 0);
    });
});