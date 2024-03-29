import {File} from '../src/files';
import {assert} from 'chai';
import {run} from "../src/run";
import {array} from "../src/array";

describe("run", function () {
    function script(name: string) {
        return [new File('example-scripts/' + name, __dirname).absolutePath];
    }

    it('when running a command streams stdout', async () => {
        const command = script('working.sh');
        const result = await array(run({command}));
        assert.deepEqual(result.join(''), 'Hello\nWorld\n');
    });

    it('can use shell redirect to get stdout and stderr in correct order (exec 2>&1)', async () => {
        const command = script('shell-redirect.sh');
        const result = await array(run({command}));
        assert.deepEqual(result.join(''), 'stout\nstderr\n');
    });

    it('can capture exit code and stdout', async () => {
        const command = script('failing.sh');
        const output: string[] = [];
        let exitCode: number | undefined = undefined;

        try {
            for await (const text of run({command})) {
                output.push(text);
            }
        } catch (e: any) {
            exitCode = e.code;
        }

        assert.deepEqual(output, ['This command returns an exit code of 1\n']);
        assert.deepEqual(exitCode, 1);
    });

    it('without shell redirect stdout and stderr are buffered (so order is not perfectly preserved)', async () => {
        const command = script('no-redirect.sh');
        const output: string[] = [];
        let exitCode: number | undefined = undefined;

        try {
            for await (const text of run({command})) {
                output.push(text);
            }
        } catch (e: any) {
            exitCode = e.code;
        }

        assert.deepEqual(output.join(''), 'one\nthree\ntwo\nfour\n');
        assert.deepEqual(exitCode, 1);
    });

    it('throw on missing script', async () => {
        const command = script('missing.sh');
        try {
            await array(run({command}));
        } catch (e: any) {
            assert.deepEqual(e.code, 'ENOENT');
        }
    });

    it('can run a command with multiple arguments', async () => {
        const result = await array(run({command: ['ls', '-a', 'package.json']}));
        assert.deepEqual(result, ['package.json\n']);
    });
});