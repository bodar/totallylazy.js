///@ts-ignore
import {parseXml, Element} from "libxmljs";
///@ts-ignore
import * as fetch from "node-fetch";
import {File} from "../files";
import {flatMap} from "../transducers";
import {array} from "../collections";

(async () => {
    ///@ts-ignore
    const response = await fetch('https://www.currency-iso.org/dam/downloads/lists/list_one.xml');
    if(response.status !== 200) {
        console.error(response);
        return;
    }
    const doc = parseXml(await response.text());
    const countries = doc.find('//CcyNtry');
    const data = countries.reduce((a: any, country:Element) => {
        const currency = country.get('Ccy');
        const decimalPlaces = country.get('CcyMnrUnts');
        if (!currency || !decimalPlaces) return a;
        const text = decimalPlaces.text();
        a[currency.text()] = {decimals: text === 'N.A.' ? 0 : Number(text)};
        return a;
    }, {});

    const generated = new File('currencies.ts', __dirname);
    const json = JSON.stringify(data, undefined, 2);
    const context = `// Generated file do not edit or checkin
export interface Currency {
  decimals: number;
}

export interface Currencies {
  [code: string] : Currency;
}    
    
export const currencies: Currencies = ${json};`;
    await generated.content(context);
})();
