"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yearOf = exports.dayOf = exports.monthOf = exports.Month = exports.weekdayOf = exports.Weekday = exports.defaultOptions = exports.date = void 0;
function date(year, month, day) {
    if (month && (month < 1 || month > 12))
        throw new Error(`Invalid month ${month}`);
    if (day && (day < 1 || day > 31))
        throw new Error(`Invalid day ${day}`);
    const date = new Date(Date.UTC(year, month ? month - 1 : 0, day ? day : 1));
    if (year !== yearOf(date))
        throw new Error(`Invalid year ${year}`);
    if (month && month !== monthOf(date))
        throw new Error(`Invalid month ${month}`);
    if (day && day !== dayOf(date))
        throw new Error(`Invalid day ${day}`);
    return date;
}
exports.date = date;
exports.defaultOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: 'long'
};
/**
 * Human readable and ISO 8601 compatible
 */
var Weekday;
(function (Weekday) {
    Weekday[Weekday["Monday"] = 1] = "Monday";
    Weekday[Weekday["Tuesday"] = 2] = "Tuesday";
    Weekday[Weekday["Wednesday"] = 3] = "Wednesday";
    Weekday[Weekday["Thursday"] = 4] = "Thursday";
    Weekday[Weekday["Friday"] = 5] = "Friday";
    Weekday[Weekday["Saturday"] = 6] = "Saturday";
    Weekday[Weekday["Sunday"] = 7] = "Sunday";
})(Weekday = exports.Weekday || (exports.Weekday = {}));
function weekdayOf(date) {
    const result = date.getUTCDay();
    if (result === 0)
        return Weekday.Sunday;
    return result;
}
exports.weekdayOf = weekdayOf;
/**
 * Human readable and ISO 8601 compatible
 */
var Month;
(function (Month) {
    Month[Month["January"] = 1] = "January";
    Month[Month["February"] = 2] = "February";
    Month[Month["March"] = 3] = "March";
    Month[Month["April"] = 4] = "April";
    Month[Month["May"] = 5] = "May";
    Month[Month["June"] = 6] = "June";
    Month[Month["July"] = 7] = "July";
    Month[Month["August"] = 8] = "August";
    Month[Month["September"] = 9] = "September";
    Month[Month["October"] = 10] = "October";
    Month[Month["November"] = 11] = "November";
    Month[Month["December"] = 12] = "December";
})(Month = exports.Month || (exports.Month = {}));
function monthOf(date) {
    return date.getUTCMonth() + 1;
}
exports.monthOf = monthOf;
function dayOf(date) {
    return date.getUTCDate();
}
exports.dayOf = dayOf;
function yearOf(date) {
    return date.getUTCFullYear();
}
exports.yearOf = yearOf;
//# sourceMappingURL=core.js.map