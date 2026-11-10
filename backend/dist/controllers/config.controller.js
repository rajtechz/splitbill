"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeatureFlags = exports.getCategories = exports.getCurrencyByCountry = exports.getCurrencies = void 0;
const response_js_1 = require("../utils/response.js");
const currency_provider_js_1 = require("../services/providers/currency.provider.js");
const getCurrencies = (_req, res) => {
    const currencies = currency_provider_js_1.currencyService.getAllCurrencies();
    return (0, response_js_1.sendSuccess)(res, currencies, 'Supported currencies list');
};
exports.getCurrencies = getCurrencies;
const getCurrencyByCountry = (req, res) => {
    const { code } = req.params;
    const currency = currency_provider_js_1.currencyService.getCurrencyForCountry(code || 'IN');
    return (0, response_js_1.sendSuccess)(res, currency, `Currency for country ${code}`);
};
exports.getCurrencyByCountry = getCurrencyByCountry;
const getCategories = (_req, res) => {
    return (0, response_js_1.sendSuccess)(res, {
        expenses: currency_provider_js_1.EXPENSE_CATEGORIES,
        groups: currency_provider_js_1.GROUP_CATEGORIES,
    }, 'Expense and group categories');
};
exports.getCategories = getCategories;
const getFeatureFlags = (_req, res) => {
    return (0, response_js_1.sendSuccess)(res, {
        otpProvider: process.env.OTP_PROVIDER || 'mock',
        pushProvider: process.env.PUSH_PROVIDER || 'mock',
        storageProvider: process.env.STORAGE_PROVIDER || 'local',
        biometricsSupported: true,
        mPinEnabled: true,
        debtSimplificationEnabled: true,
        version: '1.0.0',
    }, 'System configuration and feature flags');
};
exports.getFeatureFlags = getFeatureFlags;
