import {date, Formatters, FormatToParts, ImprovedDateTimeFormat, Options} from "../../src/dates";
import {assert} from 'chai';
import {options, supported} from "./dates.test";
import {runningInNode} from "../../src/node";
import {characters} from "../../src/characters";

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

describe("ImprovedDateTimeFormat", function () {
    it("strips RTL unicode markers from formatted date", () => {
        const containsLeadingRtlMarker = "‎Friday‎, ‎November‎ ‎20‎, ‎3333";
        assert.equal(containsLeadingRtlMarker.length, 32);
        assert.equal(characters(containsLeadingRtlMarker).length, 25);

        const result = new ImprovedDateTimeFormat('ignored', {}, {format(date?: Date | number): string {
            return containsLeadingRtlMarker;
            }} as any).format(new Date());
        assert.equal(result.length, 25);
    });

    it("adds formatToParts when missing ", () => {
        const locale = 'en';
        const options:any = {month:'long'};
        const formatter = new Intl.DateTimeFormat(locale, options);
        delete formatter.formatToParts;
        const result = new ImprovedDateTimeFormat(locale, options, formatter).formatToParts(new Date());
        assert.deepEqual(result, [{type: "month", value: "January"}]);
    });

});