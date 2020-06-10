import {assert} from 'chai';
import {runningInNode} from "../../src/node";
import {date, format, hasNativeToParts, Options, parse, parser, parsers, Pivot, SmartDate,} from "../../src/dates";
import {StoppedClock} from "../../src/dates/clock";
import {sequence} from "../../src/sequence";
import {zip} from "../../src/transducers";

export function assertFormat(locale: string, date: Date, options: Options, expected: string) {
    const formatted = format(date, locale, options);
    assert.equal(formatted, expected);
    assertParse(locale, expected, date, options);
}

export function assertDates(parsed: Date, expected: Date) {
    assert.equal(parsed.toISOString(), expected.toISOString());
}

export function assertParse(locale: string, value: string, expected: Date, options?: string | Options, native = hasNativeToParts) {
    const parsed = parse(value, locale, options, native);
    assertDates(parsed, expected);
}

function assertParseNoYears(locale: string, value: string, ...expected: Date[]) {
    const now = date(2019, 1, 1);
    const options: Options = {
        weekday: "short",
        day: "numeric",
        month: "short",
        factory: new SmartDate(new StoppedClock(now))
    };
    for (const [a, e] of sequence(parser(locale, options).parseAll(value), zip(expected))) {
        assertDates(a, e);
    }
}

export const locales: string[] = ['en', 'de', 'fr', 'ja', 'nl', 'de-DE', 'en-US', 'en-GB', 'i-enochian', 'zh-Hant',
    'sr-Cyrl', 'sr-Latn', 'zh-cmn-Hans-CN', 'cmn-Hans-CN', 'zh-yue-HK', 'yue-HK',
    'sr-Latn-RS', 'sl-rozaj', 'sl-rozaj-biske', 'sl-nedis', 'de-CH-1901', 'sl-IT-nedis',
    'es-419', 'zh-Hans', 'zh-Hans-CN', 'hy-Latn-IT-arevela'];
export const supported = Intl.DateTimeFormat.supportedLocalesOf(locales);

export const options: Options[] = [
    {day: 'numeric', year: 'numeric', month: 'long', weekday: 'long'},
    {day: 'numeric', year: 'numeric', month: 'short', weekday: 'long'},
    {day: 'numeric', year: 'numeric', month: 'long', weekday: 'short'},
    {day: 'numeric', year: 'numeric', month: 'short', weekday: 'short'},
];

describe('Pivot', () => {
    it('when converting 2 digit years use the pivotYear to correctly wrap around', function () {
        assert.equal(Pivot.on(2070).create(0, 1, 2).toISOString(), date(2000, 1, 2).toISOString());
        assert.equal(Pivot.on(2070).create(20, 1, 2).toISOString(), date(2020, 1, 2).toISOString());
        assert.equal(Pivot.on(2070).create(70, 1, 2).toISOString(), date(2070, 1, 2).toISOString());
        assert.equal(Pivot.on(2070).create(71, 1, 2).toISOString(), date(1971, 1, 2).toISOString());

        assert.equal(Pivot.on(2000).create(0, 1, 2).toISOString(), date(2000, 1, 2).toISOString());
        assert.equal(Pivot.on(2000).create(20, 1, 2).toISOString(), date(1920, 1, 2).toISOString());
        assert.equal(Pivot.on(2000).create(70, 1, 2).toISOString(), date(1970, 1, 2).toISOString());
        assert.equal(Pivot.on(2000).create(71, 1, 2).toISOString(), date(1971, 1, 2).toISOString());
    });

    it('if we pass a 4 digit year in, use it', function () {
        assert.equal(Pivot.on(2070).create(1999, 1, 2).toISOString(), date(1999, 1, 2).toISOString());
    });

    it('can parse 2 digit years', function () {
        const factory = Pivot.sliding(50, new StoppedClock(date(2000, 1, 2)));
        assertParse('en-GB', '31 Jan 19', date(2019, 1, 31), {
            day: "2-digit",
            month: "short",
            year: "2-digit",
            factory: factory
        });
        assertParse('en-GB', '1 Jan 19', date(1919, 1, 1), {
            day: "2-digit",
            month: "short",
            year: "2-digit",
            factory: Pivot.on(2000)
        });
    });
});

describe('SmartDate and Pivot', () => {
    it('can parse dates with no years in different formats', function () {
        assertParseNoYears('en-US', 'Fri, Dec 6 - Sat, Dec 7', date(2019, 12, 6), date(2019, 12, 7));
        assertParseNoYears('en-GB', 'Fri, 6 Dec - Sat, 7 Dec', date(2019, 12, 6), date(2019, 12, 7));
    });

    it('does not take part of a year as the day when 2 digit parsing - must be at a boundary', function () {
        const now = date(2019, 1, 1);
        const result = parser('en-US', {
            day: "numeric",
            month: "short",
            factory: new SmartDate(new StoppedClock(now))
        }).parseAll('Mar 2020');
        assert.equal(result.length, 0)
    });

    it('can parse dates with no years using SmartDate factory', function () {
        const now = date(2000, 2, 3);
        const option: Options = {day: "2-digit", month: "short", factory: new SmartDate(new StoppedClock(now))};
        assertParse('en-GB', '1 Mar', date(2000, 3, 1), option);
        assertParse('en-GB', '1 Jan', date(2001, 1, 1), option);
        assertParse('en-GB', '3 Feb', date(2000, 2, 3), option);
    });

    it('can parse dates with no years using SmartDate factory and a format string', function () {
        const factory = new SmartDate(new StoppedClock(date(2000, 2, 3)));
        assertParse('en', 'Tue, Sep 15', date(2000, 9, 15), {format: 'EEE, MMM dd', factory});
    });

    it('preserves 4 digit years when using SmartDate factory', function () {
        const now = date(2010, 2, 3);
        const option: Options = {
            day: "2-digit",
            month: "short",
            year: 'numeric',
            factory: new SmartDate(new StoppedClock(now))
        };
        assertParse('en-GB', '3 Feb 2020', date(2020, 2, 3), option);
        assertParse('en-GB', '3 Feb 2010', date(2010, 2, 3), option);
        assertParse('en-GB', '3 Feb 1999', date(1999, 2, 3), option);
    });

    it('when using 2 digit years will use a sliding window of 50 years with SmartDate factory', function () {
        const now = date(2010, 2, 3);
        const option: Options = {
            day: "2-digit",
            month: "short",
            year: '2-digit',
            factory: new SmartDate(new StoppedClock(now))
        };
        assertParse('en-GB', '3 Feb 20', date(2020, 2, 3), option);
        assertParse('en-GB', '3 Feb 10', date(2010, 2, 3), option);
        assertParse('en-GB', '3 Feb 99', date(1999, 2, 3), option);
    });
});

describe("dates", function () {
    before(function () {
        if (runningInNode() && process.env.NODE_ICU_DATA != './node_modules/full-icu') {
            console.log("To run these tests you must set 'NODE_ICU_DATA=./node_modules/full-icu'");
            this.skip();
        }
    });

    it('should support a number of separators', function () {
        assertDates(parser('en-GB', {
            month: "short",
            day: "numeric",
            year: "numeric"
        }).parse('29-Jan-2020'), date(2020, 1, 29));
        assertDates(parser('en-GB', {
            month: "short",
            day: "numeric",
            year: "numeric"
        }).parse('29.Jan.2020'), date(2020, 1, 29));
        assertDates(parser('en-GB', {
            month: "short",
            day: "numeric",
            year: "numeric"
        }).parse('29/Jan/2020'), date(2020, 1, 29));
        assertDates(parser('en-GB', {
            month: "short",
            day: "numeric",
            year: "numeric"
        }).parse('29,Jan,2020'), date(2020, 1, 29));
        assertDates(parser('en-GB', {
            month: "short",
            day: "numeric",
            year: "numeric"
        }).parse('29 Jan 2020'), date(2020, 1, 29));
    });

    it('should be flexible around extra commas', function () {
        assertDates(parser('en-GB').parse('13 Feb, 2020'), date(2020, 2, 13));
        assertDates(parser('en-GB').parse('Wednesday 29, January 2020'), date(2020, 1, 29));
    });

    it('does not join adjacent dates', function () {
        const result = parser('en-GB').parseAll('1/2/2030, 3/4/2040');
        assert.equal(result.length, 2);
        const [first, second] = result;
        assertDates(first, date(2030, 2, 1));
        assertDates(second, date(2040, 4, 3));
    });

    it('when we set specific option do not allow alternative formats', function () {
        assert.throws(() => parser('en-GB', {day: 'numeric', month: "short", year: 'numeric'}).parse('10/1/1977'));
    });

    it('supports custom separators', function () {
        assertDates(parser('en-GB', {separators: '@'}).parse('1@02@2020'), date(2020, 2, 1));
    });

    it('supports dots a separators', function () {
        assertDates(parser('en-GB').parse('1.02.2020'), date(2020, 2, 1));
        assertDates(parser('en-US').parse('1.02.2020'), date(2020, 1, 2));
    });

    it('should throw on ambiguous input', function () {
        assert.throws(() => parser('en').parse('13/02/2020'));
        assertDates(parser('en-GB').parse('13/02/2020'), date(2020, 2, 13));
        assertDates(parser('en-US').parse('02/13/2020'), date(2020, 2, 13));
    });

    it('can parse multiple dates in a string', function () {
        assert.deepEqual(parser('en', 'dd MMM yyyy').parseAll('Checkin: 12 Jan 2009 Checkout: 13 Jan 2009'),
            [date(2009, 1, 12), date(2009, 1, 13)]);
    });

    it('ignores values that are very nearly a valid date', function () {
        assert.deepEqual(parser('en', 'dd MMM yyyy').parseAll('Checkin: 12 Jan 2009 Checkout: 13 Jan 2009  Nearly a date: 13 Dan 2009'),
            [date(2009, 1, 12), date(2009, 1, 13)]);
    });

    it('can format and parse a date in many different locals', function () {
        const original = date(2001, 6, 3);
        for (const locale of supported) {
            for (const option of options) {
                const formatted = format(original, locale, option);
                const parsed = parse(formatted, locale, option);
                assert.equal(parsed.toISOString(), original.toISOString(), locale);
            }
        }
    });

    it('can format and parse a specific date format', function () {
        assertFormat('en-GB', date(2019, 1, 25), {
            day: 'numeric',
            year: 'numeric',
            month: 'short',
            weekday: "short"
        }, 'Fri, 25 Jan 2019');
        assertFormat('en-GB', date(2019, 1, 25), {
            day: 'numeric',
            year: 'numeric',
            month: 'numeric',
            weekday: "long"
        }, 'Friday, 25/01/2019');
        assertFormat('en-US', date(2019, 1, 25), {
            day: 'numeric',
            year: 'numeric',
            month: 'short',
            weekday: "short"
        }, 'Fri, Jan 25, 2019');
        assertFormat('en-US', date(2019, 1, 25), {
            day: 'numeric',
            year: 'numeric',
            month: 'numeric',
            weekday: "long"
        }, 'Friday, 1/25/2019');
        assertFormat('nl', date(2019, 1, 25), {
            day: 'numeric',
            year: 'numeric',
            month: 'short',
            weekday: "short"
        }, 'vr 25 jan. 2019');
        assertFormat('nl', date(2019, 1, 25), {
            day: 'numeric',
            year: 'numeric',
            month: 'numeric',
            weekday: "long"
        }, 'vrijdag 25-1-2019');
        assertFormat('es', date(2019, 1, 25), {
            day: 'numeric',
            year: 'numeric',
            month: 'numeric',
            weekday: "long"
        }, 'viernes, 25/1/2019');
        assertFormat('de', date(2019, 1, 25), {
            day: 'numeric',
            year: 'numeric',
            month: 'long',
            weekday: "long"
        }, 'Freitag, 25. Januar 2019');


        assertFormat('es-ES', date(2019, 1, 31), {day: '2-digit', year: 'numeric', month: 'short'}, '31 ene. 2019');
        assertFormat('es-ES', date(2019, 2, 1), {day: '2-digit', year: 'numeric', month: 'short'}, '01 feb. 2019');

        assertFormat('ru-RU', date(2019, 1, 31), {day: '2-digit', year: 'numeric', month: 'short'}, '31 янв. 2019 г.');
        assertFormat('ru-RU', date(2019, 2, 1), {day: '2-digit', year: 'numeric', month: 'short'}, '01 февр. 2019 г.');
    });

    it('can parse dates with additional spaces', function () {
        assertParse('zh-CN', '2019年 9月 26日 ', date(2019, 9, 26), {day: 'numeric', year: 'numeric', month: 'long'});
        assertParse('en', 'SEP 27, 2019', date(2019, 9, 27), {day: 'numeric', year: 'numeric', month: 'long'});
    });

    it("ignores case", () => {
        assertParse('es-ES', 'Martes, 15  Enero  2019', date(2019, 1, 15), {
            day: 'numeric',
            year: 'numeric',
            month: 'long',
            weekday: 'long'
        });
        assertParse('es-MX', 'Martes, 15  Enero  2019', date(2019, 1, 15), {
            day: 'numeric',
            year: 'numeric',
            month: 'long',
            weekday: 'long'
        });
        assertParse('fr-FR', 'Mardi 15 Janvier 2019', date(2019, 1, 15), {
            day: 'numeric',
            year: 'numeric',
            month: 'long',
            weekday: 'long'
        });
        assertParse('it-IT', 'Martedì 15 Gennaio 2019', date(2019, 1, 15), {
            day: 'numeric',
            year: 'numeric',
            month: 'long',
            weekday: 'long'
        });
        assertParse('pt-PT', 'Terça-feira, 15  Janeiro  2019', date(2019, 1, 15), {
            day: 'numeric',
            year: 'numeric',
            month: 'long',
            weekday: 'long'
        });
    });

    it('parsing is liberal in what it accepts', function () {
        assertParse('en-US', 'Mar 07, 2019', date(2019, 3, 7), {year: 'numeric', month: 'short', day: '2-digit'});
        assertParse('de-DE', 'Dienstag, 15. Januar 2019', date(2019, 1, 15), {
            day: 'numeric',
            year: 'numeric',
            month: 'long',
            weekday: 'long'
        });
        assertParse('en-GB', '16 January 2019', date(2019, 1, 16), {day: 'numeric', year: 'numeric', month: 'long'});
        assertParse('en-US', 'Tuesday, January 15, 2019', date(2019, 1, 15), {
            day: 'numeric',
            year: 'numeric',
            month: 'long',
            weekday: 'long'
        });
        assertParse('en-IN', '12 Mar 2019', date(2019, 3, 12), {day: 'numeric', year: 'numeric', month: 'short'});

        assertParse('ko-KR', '2019년 1월 15일 화요일', date(2019, 1, 15), {
            day: 'numeric',
            year: 'numeric',
            month: 'long',
            weekday: 'long'
        });
        assertParse('zh-TW', '2019年1月15日', date(2019, 1, 15), {day: 'numeric', year: 'numeric', month: 'long'});
        assertParse('ja-JP', '2019年1月15日', date(2019, 1, 15), {day: 'numeric', year: 'numeric', month: 'long'});

        assertParse('ru-RU', '15 январь 2019 г.', date(2019, 1, 15), {day: 'numeric', year: 'numeric', month: 'long'});
        assertParse('zh-CN', '2019年1月15日', date(2019, 1, 15), {day: 'numeric', year: 'numeric', month: 'long'});

        // assertParse('es', 'mar 07, 2019', date(2019, 3, 7), {year: 'numeric', month: 'short', day: '2-digit'});
    });

    it('can parse dates with non breaking space', function () {
        const value = 'Jan 20, 2019';
        assert.equal(value.charCodeAt(3), 160);
        assertParse('en-US', value, date(2019, 1, 20), {year: 'numeric', month: 'short', day: '2-digit'});
    });

    it("can parse a date with a trailing literal", () => {
        assertParse('ru-RU', '31 янв 2019', date(2019, 1, 31));
        assertParse('ru-RU', '31 янв. 2019 г.', date(2019, 1, 31));
    });

    it("can parse a date without specifying any options", () => {
        assertParse('en-US', 'August 16, 2019', date(2019, 8, 16));
        assertParse('en-GB', '18/12/2018', date(2018, 12, 18));
        assertParse('en-US', 'Monday, December 17, 2018', date(2018, 12, 17));
        assertParse('en-US', 'Sunday, January 20, 2019', date(2019, 1, 20));
        assertParse('ru-RU', '15 январь 2019 г.', date(2019, 1, 15));
        assertParse('ru-RU', 'пятница, 01 февр. 2019 г.', date(2019, 2, 1));
        assertParse('ru-RU', '01.2.2019', date(2019, 2, 1));
    });

    it("can use a simple format string", () => {
        assertParse('en-GB', "06 Jan 2019", date(2019, 1, 6), "dd MMM yyyy");
        assertParse('tr-TR', "06 Nis 2019", date(2019, 4, 6), "dd MMM yyyy");
        assertParse('hr-HR', "06 ožu 2019", date(2019, 3, 6), "dd MMM yyyy");
        // One letter shorter
        assertParse('ru-RU', "06 фев 2019", date(2019, 2, 6), "dd MMM yyyy");
        // Using contextual month
        assertParse('pt-PT', "06 abr 2019", date(2019, 4, 6), "dd MMM yyyy");
        assertParse('cs-CZ', "06 úno 2019", date(2019, 2, 6), "dd MMM yyyy");
        assertParse('de-DE', "01 feb. 2019", date(2019, 2, 1), "dd MMM yyyy");
    });

    it("when using a format string do not allow extra separators", () => {
        assert.throws(() => parser('en', 'dd MMM yyyy').parse('10/Jan/1977'));
    });

    it("when using a format string do not switch month format from text to digits or vice versa", () => {
        assert.throws(() => parser('en', 'dd MMM yyyy').parse('10 01 1977'));
        assert.throws(() => parser('en', 'dd MM yyyy').parse('10 Jan 1977'));
    });

    it("can parse using non native implementation", () => {
        assertParse('en-US', 'Monday, January 28, 2019', date(2019, 1, 28),
            {weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'}, false);
    });

    it("can extract multiple dates from the same text", () => {
        const text = {
            "en": 'Availability:  Mar 07, 2019 to Mar 08, 2019',
            "fr": 'Disponibilités:  07 mar, 2019 jusqu\'au 08 mar, 2019',
            // "es": 'Disponibilidad:  mar 07, 2019 to mar 08, 2019',
            // "de": 'Verfügbarkeit: Mar 07, 2019 bis Mar 08, 2019',
        };

        const factory = (locale: string) => parsers(parser(locale, "MMM dd, yyyy"), parser(locale, "dd MMM, yyyy"));

        Object.entries(text).map(([locale, text]) => {
            const p = factory(locale);
            const [checkin, checkout] = p.parseAll(text);
            if (!checkin || !checkout) throw new Error(`Locale "${locale}" failed to parse "${text}"`);
            assertDates(checkin, date(2019, 3, 7));
            assertDates(checkout, date(2019, 3, 8));
        });
    });
});


