import {date, months, Months, Options, weekdays, Weekdays} from "../../src/dates";
import {assert} from 'chai';
import {runningInNode} from "../../src/node";
import {assertParse, options, supported} from "./dates.test";

describe("Months", function () {
    before(function () {
        if (runningInNode() && process.env.NODE_ICU_DATA != './node_modules/full-icu') {
            console.log("To run these tests you must set 'NODE_ICU_DATA=./node_modules/full-icu'");
            this.skip();
        }
    });

    it("can get months for specific locals and formats", () => {
        assert.deepEqual(months('en-GB'),
            ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]);
        assert.deepEqual(months('en-GB', "short"),
            ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]);

        assert.deepEqual(months('de'),
            ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]);
        assert.deepEqual(months('de', "short"),
            ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]);
        assert.deepEqual(months('de-AT', "short"),
            ["Jän", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]);

        assert.deepEqual(months('ru'),
            ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"]);
        assert.deepEqual(months('ru', {year: "numeric", month: 'long', day: 'numeric'}),
            ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"]);
        assert.deepEqual(months('de', {year: 'numeric', month: 'short', day: '2-digit'}),
            ["Jan", "Feb", "März", "Apr", "Mai", "Juni", "Juli", "Aug", "Sept", "Okt", "Nov", "Dez"]);

        assert.deepEqual(months('zh-CN'),
            ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"]);
        assert.deepEqual(months('zh-CN', {day: 'numeric', year: 'numeric', month: 'long'}),
            ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
        assert.deepEqual(months('zh-CN', {year: 'numeric', month: 'short', day: '2-digit'}),
            ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);

        assert.deepEqual(months('is-IS'),
            ["janúar", "febrúar", "mars", "apríl", "maí", "júní", "júlí", "ágúst", "september", "október", "nóvember", "desember"]);
        assert.deepEqual(months('is-IS', 'short'),
            ["jan", "feb", "mar", "apr", "maí", "jún", "júl", "ágú", "sep", "okt", "nóv", "des"]);

        assert.deepEqual(months('cs-CZ', 'short'),
            ["led", "úno", "bře", "dub", "kvě", "čvn", "čvc", "srp", "zář", "říj", "lis", "pro"]);
        assert.deepEqual(months('pt-PT', 'short'),
            ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]);

        assert.deepEqual(months('ar-EG', {year: 'numeric', month: 'short', day: '2-digit'}),
            ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]);
    });

    it("can add additional data to help parsing", () => {
        Months.set('de', Months.create('de', [{name: 'Mrz', value: 3}]));
        assertParse('de', "06 Mrz 2019", date(2019, 3, 6), "dd MMM yyyy");
    });

    it("can override data to help parsing", () => {
        Months.set('is-IS', Months.create('is-IS', ["janúar", "febrúar", "mars", "apríl", "maí", "júní", "júlí", "ágúst", "september", "október", "nóvember", "desember"]
            .map((m, i) => ({name: m, value: i + 1}))));
        assertParse('is-IS', "06 jún 2019", date(2019, 6, 6), "dd MMM yyyy");
    });


    it('is flexible in parsing as long as there is a unique match', () => {
        const ru = Months.get('ru');
        assert.deepEqual(ru.parse('январь'), 1);
        assert.deepEqual(ru.parse('января'), 1);
        assert.deepEqual(ru.parse('январ'), 1);
        assert.deepEqual(ru.parse('янва'), 1);
        assert.deepEqual(ru.parse('янв'), 1);
        assert.deepEqual(ru.parse('янв.'), 1);
        assert.deepEqual(ru.parse('фев'), 2);

        const de = Months.get('de');
        assert.deepEqual(de.parse('Feb'), 2);
        assert.deepEqual(de.parse('Feb.'), 2);
    });

    it('can get pattern', () => {
        const ru = Months.get('ru');
        assert.deepEqual(ru.pattern, "[абвгдеийклмнопрстуфьюя]{3,8}[.]?");
        assert.deepEqual(new RegExp(ru.pattern).test('январь'), true);
        assert.deepEqual(new RegExp(ru.pattern).test('января'), true);
        assert.deepEqual(new RegExp(ru.pattern).test('янв.'), true);
        assert.deepEqual(new RegExp(ru.pattern).test('янв'), true);
    });

    it('can also parse numbers', () => {
        const months = Months.get('ru');
        assert.deepEqual(months.parse('1'), 1);
        assert.deepEqual(months.parse('01'), 1);
    });

    it('ignores case', () => {
        const months = Months.get('ru');
        assert.deepEqual(months.parse('январь'.toLocaleUpperCase('ru')), 1);
        assert.deepEqual(months.parse('января'.toLocaleLowerCase('ru')), 1);
    });

    it('can add additional data as needed', () => {
        const original = Months.get('de');
        const months = Months.set('de', Months.create("de", [{name: 'Mrz', value: 3}]));
        assert.deepEqual(months.parse('Mrz'), 3);
        Months.set('def', original);
    });
});

describe("Weekdays", function () {
    before(function () {
        if (runningInNode() && process.env.NODE_ICU_DATA != './node_modules/full-icu') {
            console.log("To run these tests you must set 'NODE_ICU_DATA=./node_modules/full-icu'");
            this.skip();
        }
    });

    it('is flexible in parsing as long as there is a unique match', () => {
        const ru = Weekdays.get('ru');
        assert.deepEqual(ru.parse('понедельник'), 1);
        assert.deepEqual(ru.parse('понеде'), 1);
        assert.deepEqual(ru.parse('пн'), 1);
    });

    it('can get pattern', () => {
        const ru = Weekdays.get('ru');
        assert.deepEqual(ru.pattern, '[абвгдеиклнопрстуцчья]{2,11}[.]?');
        assert.deepEqual(new RegExp(ru.pattern).test('понедельник'), true);
    });

    it('pattern does length does not include dot', () => {
        const es = Weekdays.get('es');
        assert.deepEqual(es.pattern, '[abcdegijlmnorstuváé]{3,9}[.]?');
        assert.deepEqual(new RegExp(es.pattern).test('jue.'), true);
        assert.deepEqual(new RegExp(es.pattern).test('jue'), true);
    });

    it('ignores case', () => {
        const ru = Weekdays.get('ru');
        assert.deepEqual(ru.parse('понедельник'.toLocaleLowerCase('ru')), 1);
        assert.deepEqual(ru.parse('понедельник'.toLocaleUpperCase('ru')), 1);
    });

    it('length of pattern is determined by valid unicode characters - exclude RTL marker', () => {
        const containsLeadingRtlMarker = "‎Jan";
        assert.equal(containsLeadingRtlMarker.length, 4);
        const weekdays = new Weekdays([{name:containsLeadingRtlMarker, value: 1}]);
        assert.deepEqual(weekdays.pattern, '[Jan]{3,3}[.]?');
        assert.deepEqual(new RegExp(weekdays.pattern).test(containsLeadingRtlMarker), true);
    });
});

describe("weekdays and months", function () {
    before(function () {
        if (runningInNode() && process.env.NODE_ICU_DATA != './node_modules/full-icu') {
            console.log("To run these tests you must set 'NODE_ICU_DATA=./node_modules/full-icu'");
            this.skip();
        }
    });

    it("non native version can still extract months from simple long format", () => {
        assert.deepEqual(months('en-GB', 'long', false), ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]);
    });

    it("non native version can still extract months from contextual long format", () => {
        assertNativeMonthsMatches('en-GB', {year: 'numeric', month: "long", day: 'numeric', weekday: 'long'});
        assertNativeMonthsMatches('ru', {year: 'numeric', month: 'short', day: '2-digit'});
        assertNativeMonthsMatches('ru', {year: "numeric", month: 'long', day: 'numeric'});
        assertNativeMonthsMatches('zh-CN', {day: 'numeric', year: 'numeric', month: 'long'});

        assertNativeMonthsMatches('zh-CN', {year: 'numeric', month: 'short', day: '2-digit'});
        assertNativeMonthsMatches('ja', {day: "numeric", year: "numeric", month: "long", weekday: "long"});
        assertNativeMonthsMatches('ja', {day: "numeric", year: "numeric", month: "long", weekday: "short"});
        // assertNativeMonthsMatches('hy-Latn-IT-arevela', {day:"numeric",year:"numeric",month:"long",weekday:"long"});

    });

    it("non native version can still extract weeks from single long format", () => {
        assert.deepEqual(weekdays('en-GB', 'long', false), weekdays('en-GB', 'long', true));
    });

    it("non native version can still extract weekdays from contextual long format", () => {
        assertNativeWeekdaysMatches('en-GB', {year: 'numeric', month: "long", day: 'numeric', weekday: 'long'});
        // assertNativeWeekdaysMatches('ja', {day: "numeric", year: "numeric", month: "long", weekday: "long"});
    });

    it("non native version works with arabic symbols", () => {
        assertNativeWeekdaysMatches('ar-EG', {day: "numeric", year: "numeric", month: "long", weekday: "long"});
        assertNativeMonthsMatches('ar-EG', {day: "numeric", year: "numeric", month: "long", weekday: "long"});
    });

    it("returns no data when no format is asked for", () => {
        assert.deepEqual(weekdays('en-GB', {}, false),[]);
        assert.deepEqual(months('en-GB', {}, false),[]);
    });

    function assertNativeWeekdaysMatches(locale: string, option: Options) {
        assert.deepEqual(cleanse(weekdays(locale, option, false)), cleanse(weekdays(locale, option, true)), `weekdays dont match '${locale}', ${JSON.stringify(option)}`);
    }

    function assertNativeMonthsMatches(locale: string, option: Options) {
        assert.deepEqual(cleanse(months(locale, option, false)), cleanse(months(locale, option, true)), `months dont match '${locale}', ${JSON.stringify(option)}`);
    }

    function cleanse(values: string[]):string[] {
        return values.map(v => v.replace(/(?<!^)[\\.月]$/g, ''));
    }

    it('weekdays matches native implementation', () => {
        for (const locale of supported) {
            for (const option of options) {
                assertNativeWeekdaysMatches(locale, option);
            }
        }
    });

    it('months matches native implementation', () => {
        for (const locale of supported.filter(l => l != 'hy-Latn-IT-arevela')) {
            for (const option of options) {
                assertNativeMonthsMatches(locale, option);
            }
        }
    });
});
