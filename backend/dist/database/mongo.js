"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedMongoDBIfEmpty = exports.isMongoConnected = exports.connectMongoDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const index_js_1 = require("../config/index.js");
const index_js_2 = require("../models/index.js");
const seedData_js_1 = require("../data/seedData.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
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
        // Check and seed initial data if collections are empty
        await (0, exports.seedMongoDBIfEmpty)();
        return true;
    }
    catch (error) {
        console.warn(`⚠️ [MONGODB CONNECTION WARNING] Could not connect to MongoDB: ${error.message}`);
        console.warn(`💡 [MONGODB] Ensure MongoDB is running locally on 127.0.0.1:27017 or check MongoDB Compass.`);
        console.warn(`📁 [SPLITMATE DB] Falling back to local file database (backend/data/db.json) while MongoDB reconnects.`);
        isConnected = false;
        return false;
    }
};
exports.connectMongoDB = connectMongoDB;
const isMongoConnected = () => isConnected;
exports.isMongoConnected = isMongoConnected;
/**
 * Seeds MongoDB collections with existing SplitMate data if collections are empty
 */
const seedMongoDBIfEmpty = async () => {
    if (!isConnected)
        return;
    try {
        // Read existing db.json if present for seamless continuity
        const dbFilePath = path_1.default.resolve(process.cwd(), 'data', 'db.json');
        let seedUsers = seedData_js_1.SEED_USERS;
        let seedGroups = seedData_js_1.SEED_GROUPS;
        let seedFriends = seedData_js_1.SEED_FRIENDS;
        let seedExpenses = seedData_js_1.SEED_EXPENSES;
        let seedSettlements = seedData_js_1.SEED_SETTLEMENTS;
        let seedActivities = seedData_js_1.SEED_ACTIVITIES;
        let seedNotifications = seedData_js_1.SEED_NOTIFICATIONS;
        if (fs_1.default.existsSync(dbFilePath)) {
            try {
                const raw = fs_1.default.readFileSync(dbFilePath, 'utf-8');
                const parsed = JSON.parse(raw);
                if (parsed.users?.length)
                    seedUsers = parsed.users;
                if (parsed.groups?.length)
                    seedGroups = parsed.groups;
                if (parsed.friends?.length)
                    seedFriends = parsed.friends;
                if (parsed.expenses?.length)
                    seedExpenses = parsed.expenses;
                if (parsed.settlements?.length)
                    seedSettlements = parsed.settlements;
                if (parsed.activities?.length)
                    seedActivities = parsed.activities;
                if (parsed.notifications?.length)
                    seedNotifications = parsed.notifications;
            }
            catch { }
        }
        const [userCount, groupCount, expenseCount] = await Promise.all([
            index_js_2.UserModel.countDocuments(),
            index_js_2.GroupModel.countDocuments(),
            index_js_2.ExpenseModel.countDocuments(),
        ]);
        if (userCount === 0) {
            console.log(`🌱 [MONGODB SEED] Seeding users collection with ${seedUsers.length} records...`);
            await index_js_2.UserModel.insertMany(seedUsers);
        }
        if (groupCount === 0) {
            console.log(`🌱 [MONGODB SEED] Seeding groups collection with ${seedGroups.length} records...`);
            await index_js_2.GroupModel.insertMany(seedGroups);
        }
        if (expenseCount === 0) {
            console.log(`🌱 [MONGODB SEED] Seeding expenses collection with ${seedExpenses.length} records...`);
            await index_js_2.ExpenseModel.insertMany(seedExpenses);
        }
        const friendCount = await index_js_2.FriendModel.countDocuments();
        if (friendCount === 0) {
            await index_js_2.FriendModel.insertMany(seedFriends);
        }
        const settlementCount = await index_js_2.SettlementModel.countDocuments();
        if (settlementCount === 0) {
            await index_js_2.SettlementModel.insertMany(seedSettlements);
        }
        const activityCount = await index_js_2.ActivityModel.countDocuments();
        if (activityCount === 0) {
            await index_js_2.ActivityModel.insertMany(seedActivities);
        }
        const notifCount = await index_js_2.NotificationModel.countDocuments();
        if (notifCount === 0) {
            await index_js_2.NotificationModel.insertMany(seedNotifications);
        }
        console.log('\n======================================================');
        console.log('🎉 [MONGODB] All SplitMate Collections Synced:');
        console.log(`👥 Users:         ${await index_js_2.UserModel.countDocuments()}`);
        console.log(`📂 Groups:        ${await index_js_2.GroupModel.countDocuments()}`);
        console.log(`🤝 Friends:       ${await index_js_2.FriendModel.countDocuments()}`);
        console.log(`💳 Expenses:      ${await index_js_2.ExpenseModel.countDocuments()}`);
        console.log(`⚖️  Settlements:   ${await index_js_2.SettlementModel.countDocuments()}`);
        console.log(`⚡ Activities:    ${await index_js_2.ActivityModel.countDocuments()}`);
        console.log(`🔔 Notifications: ${await index_js_2.NotificationModel.countDocuments()}`);
        console.log('======================================================\n');
    }
    catch (err) {
        console.error('❌ [MONGODB SEED ERROR]', err.message);
    }
};
exports.seedMongoDBIfEmpty = seedMongoDBIfEmpty;
