import {File} from '../src/files';
import {assert} from 'chai';
import {array} from "../src/collections";
import {run} from "../src/run";

describe("run", function () {
    function script(name: string) {
        return new File('example-scripts/' + name, __dirname).absolutePath;
    }

    it('when running a command streams stdout', async () => {
        const command = script('working.sh');
        const result = await array(run({command}));
        assert.deepEqual(result.join(''), 'Hello\nWorld\n');
    });

    it('combines stdout and stderr in the correct order', async () => {
        const command = script('failing.sh');
        const output: string[] = [];
        let exitCode: number | undefined = undefined;

        try {
            for await (const text of run({command})) {
                output.push(text);
            }
        } catch (e) {
            exitCode = e.code;
        }

        assert.deepEqual(output.join(''), 'one\ntwo\nthree\nfour\n');
        assert.deepEqual(exitCode, 1);
    });
});