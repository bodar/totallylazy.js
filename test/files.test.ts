import {assert} from 'chai';
import {File} from '../src/files';
import {runningInNode} from "../src/node";
import {array} from "../src/array";

describe("files", function () {
    before(function() {
        if (!runningInNode()) this.skip();
    });

    it('can return absolute path', function () {
        assert.strictEqual(new File('example/child.txt').absolutePath,
            `${File.workingDirectory.absolutePath}/example/child.txt`);
    });

    it('can return name', function () {
        assert.strictEqual(new File('example/child.txt').name, 'child.txt');
    });

    it('can list children', async () => {
        const size = (await array(new File('example/').children())).length;
        assert.strictEqual(size, 2);
    });

    it('can tell if directory', async () => {
        assert(await new File('../src').isDirectory);
    });

    it('can tell if file exists', async () => {
        assert(!await new File('some-random-file-that-does-not-exist').exists);
    });

    it('can list descendants', async () => {
        const size = (await array(new File('example/').descendants())).length;
        assert.strictEqual(size, 3);
    });

    it('can get file content as bytes', async () => {
        const bytes:Uint8Array = await new File('../run').bytes();
        assert(bytes.length > 0);
    });

    it('can get file content as string', async () => {
        const content:string = await new File('../run').content();
        assert(content.length > 0);
    });

    it('can write file content as string', async () => {
        const file = File.tempDirectory.child('run');
        await file.content('foo');
        const content = await file.content();
        assert(content === 'foo');
    });
});