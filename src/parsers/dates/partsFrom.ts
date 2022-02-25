import {Format} from "./core";
import {array} from "../../array";
import {formatRegex} from "./formatRegex";
import {map} from "../../transducers";
import {isNamedMatch} from "../../characters";
import {formatFrom} from "./formatFrom";
import DateTimeFormatPart = Intl.DateTimeFormatPart;
import DateTimeFormatPartTypes = Intl.DateTimeFormatPartTypes;


export function partsFrom(format: Format): DateTimeFormatPart[] {
    return array(formatRegex.iterate(format), map(matchOrNot => {
        if (isNamedMatch(matchOrNot)) {
            const [match] = matchOrNot.filter(m => Boolean(m.value));
            const type = match.name as DateTimeFormatPartTypes;
            const value = formatFrom(type, match.value.length);
            return {type, value};
        } else {
            return {type: "literal", value: matchOrNot};
        }
    }));
}