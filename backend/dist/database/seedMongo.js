"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongo_js_1 = require("./mongo.js");
const index_js_1 = require("../models/index.js");
const mongoose_1 = __importDefault(require("mongoose"));
const seed = async () => {
    console.log('🍃 Connecting and syncing all data into MongoDB Compass...');
    const ok = await (0, mongo_js_1.connectMongoDB)();
    if (!ok) {
        console.error('❌ Failed to connect to MongoDB at 127.0.0.1:27017');
        process.exit(1);
    }
    console.log('\n📊 SplitMate Database Status in MongoDB Compass:');
    console.log(`📍 URI:        mongodb://127.0.0.1:27017/splitmate`);
    console.log(`📦 Database:   splitmate`);
    console.log('------------------------------------------------------');
    console.log(`👥 users:         ${await index_js_1.UserModel.countDocuments()}`);
    console.log(`📂 groups:        ${await index_js_1.GroupModel.countDocuments()}`);
    console.log(`🤝 friends:       ${await index_js_1.FriendModel.countDocuments()}`);
    console.log(`💳 expenses:      ${await index_js_1.ExpenseModel.countDocuments()}`);
    console.log(`⚖️  settlements:   ${await index_js_1.SettlementModel.countDocuments()}`);
    console.log(`⚡ activities:    ${await index_js_1.ActivityModel.countDocuments()}`);
    console.log(`🔔 notifications: ${await index_js_1.NotificationModel.countDocuments()}`);
    console.log('------------------------------------------------------');
    console.log('🎉 Open MongoDB Compass and refresh to see the "splitmate" database and all 7 collections!\n');
    await mongoose_1.default.disconnect();
    process.exit(0);
};
seed().catch(err => {
    console.error(err);
    process.exit(1);
});
