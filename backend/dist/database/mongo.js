"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMongoConnected = exports.connectMongoDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const index_js_1 = require("../config/index.js");
const index_js_2 = require("../models/index.js");
let isConnected = false;
const connectMongoDB = async () => {
    try {
        const mongoUri = index_js_1.config.mongoUri;
        console.log(`\n======================================================`);
        console.log(`🍃 [MONGODB] Connecting to MongoDB Compass at:`);
        console.log(`📍 URI: ${mongoUri}`);
        console.log(`======================================================\n`);
        await mongoose_1.default.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
        });
        isConnected = true;
        console.log(`✅ [MONGODB] Connection Established Successfully!`);
        console.log(`📦 Database: splitmate`);
        console.log('\n======================================================');
        console.log('🎉 [MONGODB] SplitMate Direct MongoDB Collections:');
        console.log(`👥 Users:         ${await index_js_2.UserModel.countDocuments()}`);
        console.log(`📂 Groups:        ${await index_js_2.GroupModel.countDocuments()}`);
        console.log(`🤝 Friends:       ${await index_js_2.FriendModel.countDocuments()}`);
        console.log(`💳 Expenses:      ${await index_js_2.ExpenseModel.countDocuments()}`);
        console.log(`⚖️  Settlements:   ${await index_js_2.SettlementModel.countDocuments()}`);
        console.log(`⚡ Activities:    ${await index_js_2.ActivityModel.countDocuments()}`);
        console.log(`🔔 Notifications: ${await index_js_2.NotificationModel.countDocuments()}`);
        console.log('======================================================\n');
        return true;
    }
    catch (error) {
        console.warn(`⚠️ [MONGODB CONNECTION WARNING] Could not connect to MongoDB: ${error.message}`);
        console.warn(`💡 [MONGODB] Ensure MongoDB is running locally on 127.0.0.1:27017 or check MongoDB Compass.`);
        isConnected = false;
        return false;
    }
};
exports.connectMongoDB = connectMongoDB;
const isMongoConnected = () => isConnected;
exports.isMongoConnected = isMongoConnected;
