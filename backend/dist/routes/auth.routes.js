"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_js_1 = require("../controllers/auth.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
router.post('/login', auth_controller_js_1.login);
router.post('/register', auth_controller_js_1.register);
router.post('/otp/send', auth_controller_js_1.sendOtp);
router.post('/otp/verify', auth_controller_js_1.verifyOtp);
router.post('/refresh-token', auth_controller_js_1.refreshToken);
router.post('/forgot-password', auth_controller_js_1.forgotPassword);
router.post('/logout', auth_controller_js_1.logout);
// 4-Digit mPIN & Biometrics
router.post('/mpin/setup', auth_middleware_js_1.optionalAuth, auth_controller_js_1.setupMpin);
router.post('/mpin/verify', auth_middleware_js_1.optionalAuth, auth_controller_js_1.verifyMpin);
router.post('/mpin/toggle-biometrics', auth_middleware_js_1.optionalAuth, auth_controller_js_1.toggleBiometrics);
router.get('/security', auth_middleware_js_1.optionalAuth, auth_controller_js_1.getSecuritySettings);
exports.default = router;
