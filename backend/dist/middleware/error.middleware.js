"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const response_js_1 = require("../utils/response.js");
const errorHandler = (err, _req, res, _next) => {
    console.error('[SplitMate API Error]:', err);
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal server error';
    const code = err.code || 'INTERNAL_ERROR';
    return (0, response_js_1.sendError)(res, message, statusCode, code, err.errors);
};
exports.errorHandler = errorHandler;
