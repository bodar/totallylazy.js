import {Mapper} from "../collections";
import {removeUnicodeMarkers} from "../characters";
import {array} from "../array";
import {flatMap} from "../transducers";
import {Parser} from "./parser";

export class MappingParser<A, B> implements Parser<B> {
    constructor(private parser: Parser<A>, private mapper: Mapper<A, B>) {
    }

    parse(value: string): B {
        return this.mapper(this.parser.parse(removeUnicodeMarkers(value)));
    }

    parseAll(value: string): B[] {
        if (!value) return [];
        return array(this.parser.parseAll(removeUnicodeMarkers(value)), flatMap(v => {
            try {
                return [this.mapper(v)]
            } catch (e) {
                return [];
            }
        }));
    }
}

export function mappingParser<A, B>(parser: Parser<A>, mapper: Mapper<A, B>) {
    return new MappingParser(parser, mapper);
}