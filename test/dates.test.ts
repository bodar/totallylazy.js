import {assert} from 'chai';
import {runningInNode} from "../src/node";
import {date, format, Options, parse} from "../src/dates";

describe("dates", function () {
    before(function () {
        if (runningInNode() && process.env.NODE_ICU_DATA != './node_modules/full-icu') {
            console.log("To run these tests you must set 'NODE_ICU_DATA=./node_modules/full-icu'");
            this.skip();
        }
    });

    it('months are NOT zero based', function () {
        assert.equal(date(2000, 1, 2).toISOString(), '2000-01-02T00:00:00.000Z');
        assert.equal(date(2001, 2, 28).toISOString(), '2001-02-28T00:00:00.000Z');
    });

    it('can format and parse a date in many different locals', function () {
        const locales: string[] = ['en', 'de', 'fr', 'ja', 'nl', 'de-DE', 'en-US', 'en-GB', 'i-enochian', 'zh-Hant',
            'sr-Cyrl', 'sr-Latn', 'zh-cmn-Hans-CN', 'cmn-Hans-CN', 'zh-yue-HK', 'yue-HK',
            'sr-Latn-RS', 'sl-rozaj', 'sl-rozaj-biske', 'sl-nedis', 'de-CH-1901', 'sl-IT-nedis', 'hy-Latn-IT-arevela',
            'es-419'];//, 'zh-Hans',  'zh-Hans-CN'];
        const supported = Intl.DateTimeFormat.supportedLocalesOf(locales);

        for (const locale of supported) {
            const options: Options = {day: 'numeric', year: 'numeric', month: 'long', weekday:'long'};
            const original = date(2001, 6, 28);
            const formatted = format(original, locale, options);
            const parsed = parse(formatted, locale, options);
            assert.equal(parsed.toISOString(), original.toISOString());
        }
    });

    function assertFormat(locale: string, options: Options, expected: string, original = date(2019, 1, 25)) {
        const formatted = format(original, locale, options);
        assert.equal(formatted, expected);
        assertParse(locale, options, expected, original);
    }

    function assertParse(locale: string, options: Options, expected: string, original = date(2019, 1, 25)) {
        const parsed = parse(expected, locale, options);
        assert.equal(parsed.toISOString(), original.toISOString());
    }

    it('can format and parse a specific date format', function () {
        assertFormat('en-GB', {day: 'numeric', year: 'numeric', month: 'short', weekday: "short"}, 'Fri, 25 Jan 2019');
        assertFormat('en-GB', {day: 'numeric', year: 'numeric', month: 'numeric', weekday: "long"}, 'Friday, 25/01/2019');
        assertFormat('en-US', {day: 'numeric', year: 'numeric', month: 'short', weekday: "short"}, 'Fri, Jan 25, 2019');
        assertFormat('en-US', {day: 'numeric', year: 'numeric', month: 'numeric', weekday: "long"}, 'Friday, 1/25/2019');
        assertFormat('nl', {day: 'numeric', year: 'numeric', month: 'short', weekday: "short"}, 'vr 25 jan. 2019');
        assertFormat('nl', {day: 'numeric', year: 'numeric', month: 'numeric', weekday: "long"}, 'vrijdag 25-1-2019');
        assertFormat('es', {day: 'numeric', year: 'numeric', month: 'numeric', weekday: "long"}, 'viernes, 25/1/2019');


        assertFormat('es-ES', {day: '2-digit', year: 'numeric', month: 'short'}, '31 ene. 2019', date(2019,1,31));
        assertFormat('es-ES', {day: '2-digit', year: 'numeric', month: 'short'}, '01 feb. 2019', date(2019,2,1));

        assertFormat('ru-RU', {day: '2-digit', year: 'numeric', month: 'short'}, '31 янв. 2019 г.', date(2019,1,31));
        assertFormat('ru-RU', {day: '2-digit', year: 'numeric', month: 'short'}, '01 февр. 2019 г.', date(2019,2,1));
    });

    it('follows the robustness principle - so liberal in what it accepts', function () {
        assertParse('ru-RU', {day: '2-digit', year: 'numeric', month: 'short'}, '31 янв 2019', date(2019,1,31));
    });
});
