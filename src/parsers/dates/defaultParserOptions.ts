import {Format, Options} from "./core";

export const defaultParserOptions: (Format | Options)[] = [
    {year: 'numeric', month: 'long', day: 'numeric', weekday: "long"},
    {year: 'numeric', month: 'short', day: 'numeric', weekday: 'short'},
    {year: 'numeric', month: 'numeric', day: 'numeric'},
    {year: 'numeric', month: 'short', day: 'numeric'},
    {year: 'numeric', month: 'long', day: 'numeric'}
];