import {Options} from "./core";
import DateTimeFormatPartTypes = Intl.DateTimeFormatPartTypes;


export class BaseDataExtractor {
    constructor(protected locale: string,
                protected options: Options,
                protected dates: Date[],
                protected partType: DateTimeFormatPartTypes) {
    }
}