import {assert} from 'chai';
import {Path} from './files';
import {runningInNode} from "./node";

describe("files", function () {
    before(function() {
        if (!runningInNode()) this.skip();
    });

    it('can return absolute path', function () {
        assert(new Path('src').absolutePath.endsWith("http4js/src"));
    });

    it('can list children', async () => {
        for await (const child of new Path('src').children()) {
            //TODO something sensible
        }
    });

    it('can tell if directory', async () => {
        assert(await new Path('src').isDirectory);
    });

    it('can list descendants', async () => {
        for await (const child of new Path('src').descendants()) {
            //TODO something sensible
        }
    });
});