import {assert} from 'chai';
import {runningInNode} from "../src/node";
import {date, format, months, Options, parse} from "../src/dates";

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
            assert.equal(parsed.toISOString(), original.toISOString(), locale);
        }
    });

    function assertFormat(locale: string, date: Date, options: Options, expected: string) {
        const formatted = format(date, locale, options);
        assert.equal(formatted, expected);
        assertParse(locale, expected, options, date);
    }

    function assertParse(locale: string, value: string, options: Options, expected: Date) {
        const parsed = parse(value, locale, options);
        assert.equal(parsed.toISOString(), expected.toISOString());
    }

    it('can format and parse a specific date format', function () {
        assertFormat('en-GB', date(2019, 1, 25), {day: 'numeric', year: 'numeric', month: 'short', weekday: "short"}, 'Fri, 25 Jan 2019');
        assertFormat('en-GB', date(2019, 1, 25), {day: 'numeric', year: 'numeric', month: 'numeric', weekday: "long"}, 'Friday, 25/01/2019');
        assertFormat('en-US', date(2019, 1, 25), {day: 'numeric', year: 'numeric', month: 'short', weekday: "short"}, 'Fri, Jan 25, 2019');
        assertFormat('en-US', date(2019, 1, 25), {day: 'numeric', year: 'numeric', month: 'numeric', weekday: "long"}, 'Friday, 1/25/2019');
        assertFormat('nl', date(2019, 1, 25), {day: 'numeric', year: 'numeric', month: 'short', weekday: "short"}, 'vr 25 jan. 2019');
        assertFormat('nl', date(2019, 1, 25), {day: 'numeric', year: 'numeric', month: 'numeric', weekday: "long"}, 'vrijdag 25-1-2019');
        assertFormat('es', date(2019, 1, 25), {day: 'numeric', year: 'numeric', month: 'numeric', weekday: "long"}, 'viernes, 25/1/2019');


        assertFormat('es-ES', date(2019, 1, 31), {day: '2-digit', year: 'numeric', month: 'short'}, '31 ene. 2019');
        assertFormat('es-ES', date(2019, 2, 1), {day: '2-digit', year: 'numeric', month: 'short'}, '01 feb. 2019');

        assertFormat('ru-RU', date(2019, 1, 31), {day: '2-digit', year: 'numeric', month: 'short'}, '31 янв. 2019 г.');
        assertFormat('ru-RU', date(2019, 2, 1), {day: '2-digit', year: 'numeric', month: 'short'}, '01 февр. 2019 г.');
    });

    it("ignores case", () => {
        assertParse('es-ES', 'Martes, 15  Enero  2019', {day: 'numeric', year: 'numeric', month: 'long', weekday: 'long'}, date(2019, 1, 15));
        assertParse('es-MX', 'Martes, 15  Enero  2019', {day: 'numeric', year: 'numeric', month: 'long', weekday: 'long'}, date(2019, 1, 15));
        assertParse('fr-FR', 'Mardi 15 Janvier 2019', {day: 'numeric', year: 'numeric', month: 'long', weekday: 'long'}, date(2019, 1, 15));
        assertParse('it-IT', 'Martedì 15 Gennaio 2019', {day: 'numeric', year: 'numeric', month: 'long', weekday: 'long'}, date(2019, 1, 15));
        assertParse('pt-PT', 'Terça-feira, 15  Janeiro  2019', {day: 'numeric', year: 'numeric', month: 'long', weekday: 'long'}, date(2019, 1, 15));
    });

    it('parsing is liberal in what it accepts', function () {
        assertParse('ru-RU', '31 янв 2019', {day: '2-digit', year: 'numeric', month: 'short'}, date(2019, 1, 31));
        assertParse('de-DE', 'Dienstag, 15. Januar 2019', {day: 'numeric', year: 'numeric', month: 'long', weekday: 'long'}, date(2019, 1, 15));
        assertParse('en-GB', '16 January 2019', {day: 'numeric', year: 'numeric', month: 'long'}, date(2019, 1, 16));
        assertParse('en-US', 'Tuesday, January 15, 2019', {day: 'numeric', year: 'numeric', month: 'long', weekday: 'long'}, date(2019, 1, 15));

        assertParse('ko-KR', '2019년 1월 15일 화요일', {day: 'numeric', year: 'numeric', month: 'long', weekday:'long'}, date(2019, 1, 15));
        assertParse('zh-TW', '2019年1月15日', {day: 'numeric', year: 'numeric', month: 'long'}, date(2019, 1, 15));
        assertParse('ja-JP', '2019年1月15日', {day: 'numeric', year: 'numeric', month: 'long'}, date(2019, 1, 15));

        // TODO Remove 'this.monthLiteral + '?' in literalRegex once we have better month diff support
        assertParse('ru-RU', '15 январь 2019 г.', {day: 'numeric', year: 'numeric', month: 'long'}, date(2019, 1, 15));
        // TODO Fix chinese
        // assertParse('zh-CN', '2019年1月15日', {day: 'numeric', year: 'numeric', month: 'numeric'}, date(2019, 1, 15));
    });
});
