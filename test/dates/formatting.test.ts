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
        assert.deepEqual(actual.map(v => v.value).join(""), expected.map(v => v.value).join(""), `${locale} ${JSON.stringify(option)}`)
        assert.deepEqual(actual.map(v => v.type), expected.map(v => v.type), `${locale} ${JSON.stringify(option)}`)
    }

    it('matches native implementation', () => {
        for (const locale of supported.filter(s => s != 'hy-Latn-IT-arevela')) {
            for (const option of options) {
                assertPartsMatch(locale, option, d);
            }
        }
    });

    it("specific options work", () => {
        // assertPartsMatch('hy-Latn-IT-arevela', {day: "numeric", year: "numeric", month: "long", weekday: "long"}, d);
        assertPartsMatch('de', {day: "numeric", year: "numeric", month: "long", weekday: "short"}, d);
        assertPartsMatch('ja', {day: "numeric", year: "numeric", month: "long", weekday: "short"}, d);
        assertPartsMatch('ja', {day: "numeric", year: "numeric", month: "long", weekday: "long"}, d);
        assertPartsMatch('en', {day: 'numeric', year: 'numeric', month: 'long', weekday: 'long'}, d);
        assertPartsMatch('de', {day: 'numeric', year: 'numeric', month: 'long', weekday: 'long'}, d);
        assertPartsMatch('ru', {day: 'numeric', year: 'numeric', month: 'long', weekday: 'long'}, d);
    });

    it("works even when no weekday format is asked for", () => {
        assertPartsMatch('en', {day: 'numeric', year: 'numeric', month: 'long'}, d);
    });
});