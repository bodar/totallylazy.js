import {Parser} from "./parser";

export class FailParser implements Parser<any> {
    parse(value: string): any {
        throw new Error();
    }

    parseAll(value: string): any[] {
        return [];
    }
}