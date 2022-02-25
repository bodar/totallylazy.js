import {exactFormat} from "./formatters";
import {different} from "../../characters";
import {BaseDataExtractor} from "./baseDataExtractor";
import {DataExtractor} from "./dataExtractor";

export abstract class FromFormatStringDataExtractor extends BaseDataExtractor implements DataExtractor {
    extract(): string[] {
        const exact = Object.keys(this.options).length == 1;
        const fullFormats = exactFormat(this.locale, this.options, this.dates);
        if (exact) return fullFormats;
        const simpleFormats = exactFormat(this.locale, {[this.partType]: (this.options as any)[this.partType]} as any, this.dates);
        const diffs = this.diff(fullFormats);
        const result = [];
        for (let i = 0; i < simpleFormats.length; i++) {
            const full = fullFormats[i];
            const simple = simpleFormats[i];
            const diff = diffs[i];
            result.push(full.indexOf(simple) != -1 && simple.length > diff.length && isNaN(parseInt(diff)) ? simple : diff);
        }

        return result;
    }

    diff(data: string[]): string[] {
        return different(data);
    }
}