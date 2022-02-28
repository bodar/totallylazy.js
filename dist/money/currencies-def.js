"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.additionalSymbols = void 0;
const preferred_currencies_1 = require("./preferred-currencies");
exports.additionalSymbols = [
    ...Object.entries(preferred_currencies_1.PreferredCurrencies.dollarCountries).map(([, iso]) => ({ iso, symbol: '$' })),
    ...Object.entries(preferred_currencies_1.PreferredCurrencies.poundCountries).map(([, iso]) => ({ iso, symbol: '£' })),
    ...Object.entries(preferred_currencies_1.PreferredCurrencies.yenCountries).flatMap(([, iso]) => ([{ iso, symbol: '¥' }, { iso, symbol: '￥' }])),
    { iso: 'KES', symbol: 'KSh' },
    { iso: 'VND', symbol: 'đ' },
    { iso: 'INR', symbol: 'Rs' },
    { iso: 'INR', symbol: '₹' },
    { iso: 'PKR', symbol: 'Rs' },
    { iso: 'LKR', symbol: 'Rs' },
    { iso: 'LKR', symbol: 'රු' },
    { iso: 'LKR', symbol: 'ரூ' },
    { iso: 'IDR', symbol: 'Rp' },
    { iso: 'IDR', symbol: 'Rs' },
    { iso: 'NPR', symbol: 'रु' },
    { iso: 'NPR', symbol: '₨' },
    { iso: 'NPR', symbol: 'Re' },
    { iso: 'MZN', symbol: 'MT' },
    { iso: 'MZN', symbol: 'MTn' },
    { iso: 'AED', symbol: 'د.إ' },
    { iso: 'AED', symbol: 'DH' },
    { iso: 'AED', symbol: 'Dhs' },
];
//# sourceMappingURL=currencies-def.js.map