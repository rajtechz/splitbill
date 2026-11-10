"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.search = void 0;
const store_js_1 = require("../data/store.js");
const response_js_1 = require("../utils/response.js");
const search = async (req, res) => {
    const query = (req.query.q || '').trim().toLowerCase();
    if (!query) {
        return (0, response_js_1.sendSuccess)(res, { groups: [], friends: [], expenses: [] });
    }
    const groups = store_js_1.store
        .getGroups()
        .filter(g => g.name.toLowerCase().includes(query) || g.category.toLowerCase().includes(query));
    const friends = store_js_1.store
        .getFriends()
        .filter(f => f.name.toLowerCase().includes(query) || f.email.toLowerCase().includes(query));
    const expenses = store_js_1.store
        .getExpenses()
        .filter(e => e.title.toLowerCase().includes(query) ||
        e.category.toLowerCase().includes(query) ||
        (e.notes && e.notes.toLowerCase().includes(query)));
    return (0, response_js_1.sendSuccess)(res, {
        groups,
        friends,
        expenses,
    });
};
exports.search = search;
