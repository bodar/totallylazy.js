import {Parser} from "./parser";

export class IdentityParser implements Parser<string> {
    parse(value: string): string {
        return value;
    }

    parseAll(value: string): string[] {
        return [value];
    }
}