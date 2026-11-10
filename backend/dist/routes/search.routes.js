"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const search_controller_js_1 = require("../controllers/search.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
router.use(auth_middleware_js_1.requireAuth);
router.get('/', search_controller_js_1.search);
exports.default = router;
