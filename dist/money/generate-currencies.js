"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const xpath_1 = require("xpath");
const xmldom_1 = require("xmldom");
const node_fetch_1 = require("node-fetch");
const files_1 = require("../files");
const wikidata_sdk_1 = require("wikidata-sdk");
const currencies_def_1 = require("./currencies-def");
(() => (0, tslib_1.__awaiter)(void 0, void 0, void 0, function* () {
    const symbols = yield getSymbols();
    const currencies = symbols.reduce((c, s) => {
        const currency = c[s.iso] || { symbols: [], decimals: 2 };
        if (!currency.symbols.includes(s.symbol))
            currency.symbols.push(s.symbol);
        return c;
    }, yield getCurrencies());
    const allCurrencies = currencies_def_1.additionalSymbols.reduce((c, s) => {
        const currency = c[s.iso] || { symbols: [], decimals: 2 };
        if (!currency.symbols.includes(s.symbol))
            currency.symbols.push(s.symbol);
        c[s.iso] = currency;
        return c;
    }, currencies);
    yield generateFile(allCurrencies);
}))();
function getCurrencies() {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const url = 'https://www.currency-iso.org/dam/downloads/lists/list_one.xml';
        console.log(`Downloading ${url}`);
        const response = yield (0, node_fetch_1.default)(url);
        if (response.status !== 200) {
            throw new Error(response.statusText);
        }
        const doc = new xmldom_1.DOMParser().parseFromString(yield response.text(), 'application/xml');
        const countries = (0, xpath_1.select)('//CcyNtry', doc);
        return countries.reduce((a, country) => {
            const currency = (0, xpath_1.select)('string(Ccy)', country, true);
            const decimalPlaces = (0, xpath_1.select)('string(CcyMnrUnts)', country, true);
            if (!currency || !decimalPlaces)
                return a;
            a[currency] = {
                decimals: decimalPlaces === 'N.A.' ? 0 : Number(decimalPlaces),
                symbols: []
            };
            return a;
        }, {});
    });
}
function getSymbols() {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const query = (0, wikidata_sdk_1.sparqlQuery)(`SELECT DISTINCT ?iso ?symbol WHERE {
  ?item wdt:P31 wd:Q8142.
  ?item wdt:P498 ?iso. 
  ?item wdt:P5061 ?symbol. 
}`);
        const response = yield (0, node_fetch_1.default)(query);
        if (response.status !== 200) {
            throw new Error(response.statusText);
        }
        return wikidata_sdk_1.simplify.sparqlResults(yield response.json());
    });
}
function generateFile(currencies) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const generated = new files_1.File('currencies.ts', __dirname);
        console.log(`Generating ${generated.absolutePath}`);
        const json = JSON.stringify(currencies, null, 2);
        const content = `// Generated file do not edit or checkin
import {Currencies} from "./currencies-def";
    
export const currencies: Currencies = ${json};`;
        yield generated.content(content);
    });
}
//# sourceMappingURL=generate-currencies.js.map