import {date, Formatters, FormatToParts} from "../../src/dates";
import {assert} from 'chai';
import {options} from "./dates.test";
import {runningInNode} from "../../src/node";

describe("FormatToParts", function () {
    before(function () {
        if (runningInNode() && process.env.NODE_ICU_DATA != './node_modules/full-icu') {
            console.log("To run these tests you must set 'NODE_ICU_DATA=./node_modules/full-icu'");
            this.skip();
        }
    });

    it('matches native implementation', () => {
        const original = date(2001, 6, 28);
        for (const locale of ['en', 'ru', 'fr']) {//'de'
            for (const option of options) {
                const formatter = Formatters.create(locale, option);
                const expected = formatter.formatToParts(original);
                const actual = FormatToParts.create(locale, option).formatToParts(original);
                assert.deepEqual(expected, actual)
            }
        }
    });
});