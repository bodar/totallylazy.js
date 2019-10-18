import {Suite, options} from "benchmark";
import {PrefixTree} from "../src/trie";
import {File} from "../src/files";
import {ascending, Comparator} from "../src/collections";


interface HotelIdentifiers {
    "hotelIdentifier": string,
    "apiKey": string,
    "identifierId": string
}

function build(idenitifiers: HotelIdentifiers[], comparator: Comparator<string>) {
    return idenitifiers.reduce((p, id) => p.insert(id.hotelIdentifier, id), new PrefixTree<HotelIdentifiers>(undefined, comparator));
}


(async () => {
    const json = await new File('perf/identifiers.json').content();
    const idenitifiers: HotelIdentifiers[] = JSON.parse(json);
    const sort = new Intl.Collator(undefined, {usage: 'sort', sensitivity: 'base'}).compare;
    const search = new Intl.Collator(undefined, {usage: 'search', sensitivity: 'base'}).compare;


    const suite = new Suite('PrefixTree');

    suite.add('IntlComparator sort', function () {
        build(idenitifiers, sort);
    }).add('IntlComparator search', function () {
        build(idenitifiers, search);
    }).add('ascending', function () {
        build(idenitifiers, ascending);
    }).on('cycle', function (event: any) {
        console.log(String(event.target));
    }).on('complete', function () {
        // @ts-ignore
        console.log('Fastest is ' + this.filter('fastest').map('name'));
    }).run({'async': true});
})();

