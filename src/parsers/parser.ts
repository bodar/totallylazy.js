export interface Parser<T> {
    parse(value: string): T;

    parseAll(value: string): T[];
}