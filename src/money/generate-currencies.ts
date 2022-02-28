import {select} from "xpath";
import {DOMParser} from "xmldom";
import fetch from "node-fetch";
import {File} from "../files";
import {simplify, sparqlQuery} from 'wikidata-sdk';
import {additionalSymbols, Currency, CurrencySymbol} from "./currencies-def";

(async () => {
    const symbols = await getSymbols();
    const currencies = symbols.reduce((c, s) => {
        const currency = c[s.iso] || {symbols: [], decimals: 2};
        if (!currency.symbols.includes(s.symbol)) currency.symbols.push(s.symbol);
        return c;
    }, await getCurrencies());

    const allCurrencies = additionalSymbols.reduce((c, s) => {
        const currency = c[s.iso] || {symbols: [], decimals: 2};
        if (!currency.symbols.includes(s.symbol)) currency.symbols.push(s.symbol);
        c[s.iso] = currency;
        return c;
    }, currencies);

    await generateFile(allCurrencies);
})();

async function getCurrencies(): Promise<Currencies> {
    const url = 'https://www.currency-iso.org/dam/downloads/lists/list_one.xml';
    console.log(`Downloading ${url}`);
    const response = await fetch(url);
    if (response.status !== 200) {
        throw new Error(response.statusText);
    }
    const doc = new DOMParser().parseFromString(await response.text(), 'application/xml');
    const countries = select('//CcyNtry', doc) as Node[];
    return countries.reduce((a: Currencies, country: Node) => {
        const currency = select('string(Ccy)', country, true) as string;
        const decimalPlaces = select('string(CcyMnrUnts)', country, true) as string;
        if (!currency || !decimalPlaces) return a;
        a[currency] = {
            decimals: decimalPlaces === 'N.A.' ? 0 : Number(decimalPlaces),
            symbols: []
        };
        return a;
    }, {} as Currencies);
}

export interface Currencies {
    [code: string]: Currency;
}


async function getSymbols(): Promise<CurrencySymbol[]> {
    const query = sparqlQuery(`SELECT DISTINCT ?iso ?symbol WHERE {
  ?item wdt:P31 wd:Q8142.
  ?item wdt:P498 ?iso. 
  ?item wdt:P5061 ?symbol. 
}`);

    const response = await fetch(query);
    if (response.status !== 200) {
        throw new Error(response.statusText);
    }

    return (simplify as any).sparqlResults(await response.json());
}

async function generateFile(currencies: Currencies) {
    const generated = new File('currencies.ts', __dirname);
    console.log(`Generating ${generated.absolutePath}`);
    const json = JSON.stringify(currencies, null, 2);
    const content = `// Generated file do not edit or checkin
import {Currencies} from "./currencies-def";
    
export const currencies: Currencies = ${json};`;
    await generated.content(content);
}
