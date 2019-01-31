import {characters, splitByRegex, different} from "../src/characters";
import {assert} from 'chai';

describe("difference", function () {
    it("can find differences between string", () => {
        const values = ["2000年1月1日", "2000年2月1日", "2000年3月1日", "2000年4月1日", "2000年5月1日", "2000年6月1日", "2000年7月1日", "2000年8月1日", "2000年9月1日", "2000年10月1日", "2000年11月1日", "2000年12月1日"];
        assert.deepEqual(different(values), ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);

        const russianMonths = ['1 января 2000 г', '1 февраля 2000 г', '1 марта 2000 г', '1 апреля 2000 г', '1 мая 2000 г', '1 июня 2000 г', '1 июля 2000 г', '1 августа 2000 г', '1 сентября 2000 г', '1 октября 2000 г', '1 ноября 2000 г', '1 декабря 2000 г'];
        assert.deepEqual(different(russianMonths), ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']);

        const shortRussian = ['01 янв. 2000 г.', '01 февр. 2000 г.', '01 мар. 2000 г.', '01 апр. 2000 г.', '01 мая 2000 г.', '01 июн. 2000 г.', '01 июл. 2000 г.', '01 авг. 2000 г.', '01 сент. 2000 г.', '01 окт. 2000 г.', '01 нояб. 2000 г.', '01 дек. 2000 г.'];
        assert.deepEqual(different(shortRussian), ['янв.', 'февр.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.']);
    });

    it("can find difference when at end of string", () => {
        const input = ["Jan 2000 Mon","Jan 2000 Tue","Jan 2000 Wed","Jan 2000 Thu","Jan 2000 Fri","Jan 2000 Sat","Jan 2000 Sun"];
        assert.deepEqual(different(input), ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    });

    it("can find difference when at start of string", () => {
        const input = ["Mon Jan 2000","Tue Jan 2000","Wed Jan 2000","Thu Jan 2000","Fri Jan 2000","Sat Jan 2000","Sun Jan 2000"];
        assert.deepEqual(different(input), ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    });
});


describe("characters", function() {
    it("can split by regex for IE 11", () => {
        const characters = splitByRegex("Foo bar");
        assert.equal(characters.length, 7);
    });

    it("ignores RTL unicode marker", () => {
        const containsLeadingRtlMarker = "‎Jan";
        assert.equal(containsLeadingRtlMarker.length, 4);
        assert.equal(characters(containsLeadingRtlMarker).length, 3);
    });
});