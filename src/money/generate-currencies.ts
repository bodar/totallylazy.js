///@ts-ignore
import {Element, parseXml} from "libxmljs";
///@ts-ignore
import * as fetch from "node-fetch";
import {File} from "../files";
import {sparqlQuery, simplify} from 'wikidata-sdk';
import {additionalSymbols, Currency, CurrencySymbol} from "./currencies-def";

(async () => {
    const symbols = [...await getSymbols(), ...additionalSymbols];
    const currencies = symbols.reduce((c, s) => {
        const currency = c[s.iso] || {symbols: [], decimals: 2};
        if(!currency.symbols.includes(s.symbol)) currency.symbols.push(s.symbol);
        return c;
    }, await getCurrencies());
    await generateFile(currencies);
})();

async function getCurrencies(): Promise<Currencies> {
    const url = 'https://www.currency-iso.org/dam/downloads/lists/list_one.xml';
    console.log(`Downloading ${url}`);
    ///@ts-ignore
    const response = await fetch(url);
    if (response.status !== 200) {
        throw new Error(response);
    }
    const doc = parseXml(await response.text());
    const countries = doc.find('//CcyNtry');
    return countries.reduce((a: Currencies, country: Element) => {
        const currency = country.get('Ccy');
        const decimalPlaces = country.get('CcyMnrUnts');
        if (!currency || !decimalPlaces) return a;
        const text = decimalPlaces.text();
        a[currency.text()] = {
            decimals: text === 'N.A.' ? 0 : Number(text),
            symbols: []
        };
        return a;
    }, {});
}

export interface Currencies {
    [code: string] : Currency;
}



async function getSymbols(): Promise<CurrencySymbol[]> {
    const query = sparqlQuery(`SELECT DISTINCT ?iso ?symbol WHERE {
  ?item wdt:P31 wd:Q8142.
  ?item wdt:P498 ?iso. 
  ?item wdt:P5061 ?symbol. 
}`);

    ///@ts-ignore
    const response = await fetch(query);
    if (response.status !== 200) {
        throw new Error(response);
    }

    return (simplify as any).sparqlResults(await response.json());
}

async function generateFile(currencies: Currencies) {
    const generated = new File('currencies.ts', __dirname);
    console.log(`Generating ${generated.absolutePath}`);
    const json = JSON.stringify(currencies, undefined, 2);
    const content = `// Generated file do not edit or checkin
import {Currencies} from "./currencies-def";
    
export const currencies: Currencies = ${json};`;
    await generated.content(content);
}
