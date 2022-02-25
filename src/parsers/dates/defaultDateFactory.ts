import {DateFactory, DateFactoryParts} from "./core";
import {date} from "../../dates";

export class DefaultDateFactory implements DateFactory {
    create({year, month, day}: DateFactoryParts): Date {
        if (typeof year === "undefined") throw new Error("No year found");
        return date(year, month, day);
    }
}