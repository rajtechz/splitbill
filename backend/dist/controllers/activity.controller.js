"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivities = void 0;
const store_js_1 = require("../data/store.js");
const response_js_1 = require("../utils/response.js");
const getActivities = async (_req, res) => {
    const activities = store_js_1.store.getActivities();
    return (0, response_js_1.sendSuccess)(res, activities);
};
exports.getActivities = getActivities;
