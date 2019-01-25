import {date, Formatters, FormatToParts, Options} from "../../src/dates";
import {assert} from 'chai';
import {options, supported} from "./dates.test";
import {runningInNode} from "../../src/node";

describe("FormatToParts", function () {
    before(function () {
        if (runningInNode() && process.env.NODE_ICU_DATA != './node_modules/full-icu') {
            console.log("To run these tests you must set 'NODE_ICU_DATA=./node_modules/full-icu'");
            this.skip();
        }
    });

    const d = date(2001, 6, 28);

    function assertPartsMatch(locale: string, option: Options, original: Date) {
        const formatter = Formatters.create(locale, option);
        const expected = formatter.formatToParts(original);
        const actual = FormatToParts.create(locale, option).formatToParts(original);
        assert.deepEqual(expected, actual, `${locale} ${JSON.stringify(option)}`)
    }

    it('matches native implementation', () => {
        for (const locale of supported) {
            for (const option of options) {
                assertPartsMatch(locale, option, d);
            }
        }
    });

    it("specific options work", () => {
        assertPartsMatch('ja', {day: "numeric", year: "numeric", month: "long", weekday: "long"}, d);
        assertPartsMatch('de', {day: 'numeric', year: 'numeric', month: 'long', weekday: 'long'}, d);
        assertPartsMatch('de', {day: 'numeric', year: 'numeric', month: 'long', weekday: 'short'}, d);
    });
});