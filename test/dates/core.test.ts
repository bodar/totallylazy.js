import {date} from "../../src/dates";
import {assert} from 'chai';

describe("core", function () {
    it('months are NOT zero based', function () {
        assert.equal(date(2000, 1, 2).toISOString(), '2000-01-02T00:00:00.000Z');
        assert.equal(date(2001, 2, 28).toISOString(), '2001-02-28T00:00:00.000Z');
    });

    it('defaults to 1st January if no month or date are provided', () => {
        assert.equal(date(2000).toISOString(), '2000-01-01T00:00:00.000Z');
        assert.equal(date(2000, 2).toISOString(), '2000-02-01T00:00:00.000Z');
    });
});