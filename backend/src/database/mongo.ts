import mongoose from 'mongoose';
import { config } from '../config/index.js';
import {
  UserModel,
  GroupModel,
  FriendModel,
  ExpenseModel,
  SettlementModel,
  ActivityModel,
  NotificationModel,
} from '../models/index.js';
import {
  SEED_USERS,
  SEED_FRIENDS,
  SEED_GROUPS,
  SEED_EXPENSES,
  SEED_SETTLEMENTS,
  SEED_ACTIVITIES,
  SEED_NOTIFICATIONS,
} from '../data/seedData.js';
import fs from 'fs';
import path from 'path';

let isConnected = false;

export const connectMongoDB = async (): Promise<boolean> => {
  try {
    const mongoUri = config.mongoUri;
    console.log(`\n======================================================`);
    console.log(`🍃 [MONGODB] Connecting to MongoDB Compass at:`);
    console.log(`📍 URI: ${mongoUri}`);
    console.log(`======================================================\n`);

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log(`✅ [MONGODB] Connection Established Successfully!`);
    console.log(`📦 Database: splitmate`);

    // Check and seed initial data if collections are empty
    await seedMongoDBIfEmpty();

    return true;
  } catch (error: any) {
    console.warn(`⚠️ [MONGODB CONNECTION WARNING] Could not connect to MongoDB: ${error.message}`);
    console.warn(`💡 [MONGODB] Ensure MongoDB is running locally on 127.0.0.1:27017 or check MongoDB Compass.`);
    console.warn(`📁 [SPLITMATE DB] Falling back to local file database (backend/data/db.json) while MongoDB reconnects.`);
    isConnected = false;
    return false;
  }
};

export const isMongoConnected = (): boolean => isConnected;

/**
 * Seeds MongoDB collections with existing SplitMate data if collections are empty
 */
export const seedMongoDBIfEmpty = async () => {
  if (!isConnected) return;

  try {
    // Read existing db.json if present for seamless continuity
    const dbFilePath = path.resolve(process.cwd(), 'data', 'db.json');
    let seedUsers = SEED_USERS;
    let seedGroups = SEED_GROUPS;
    let seedFriends = SEED_FRIENDS;
    let seedExpenses = SEED_EXPENSES;
    let seedSettlements = SEED_SETTLEMENTS;
    let seedActivities = SEED_ACTIVITIES;
    let seedNotifications = SEED_NOTIFICATIONS;

    if (fs.existsSync(dbFilePath)) {
      try {
        const raw = fs.readFileSync(dbFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users?.length) seedUsers = parsed.users;
        if (parsed.groups?.length) seedGroups = parsed.groups;
        if (parsed.friends?.length) seedFriends = parsed.friends;
        if (parsed.expenses?.length) seedExpenses = parsed.expenses;
        if (parsed.settlements?.length) seedSettlements = parsed.settlements;
        if (parsed.activities?.length) seedActivities = parsed.activities;
        if (parsed.notifications?.length) seedNotifications = parsed.notifications;
      } catch {}
    }

    const [userCount, groupCount, expenseCount] = await Promise.all([
      UserModel.countDocuments(),
      GroupModel.countDocuments(),
      ExpenseModel.countDocuments(),
    ]);

    if (userCount === 0) {
      console.log(`🌱 [MONGODB SEED] Seeding users collection with ${seedUsers.length} records...`);
      await UserModel.insertMany(seedUsers);
    }
    if (groupCount === 0) {
      console.log(`🌱 [MONGODB SEED] Seeding groups collection with ${seedGroups.length} records...`);
      await GroupModel.insertMany(seedGroups);
    }
    if (expenseCount === 0) {
      console.log(`🌱 [MONGODB SEED] Seeding expenses collection with ${seedExpenses.length} records...`);
      await ExpenseModel.insertMany(seedExpenses);
    }

    const friendCount = await FriendModel.countDocuments();
    if (friendCount === 0) {
      await FriendModel.insertMany(seedFriends);
    }

    const settlementCount = await SettlementModel.countDocuments();
    if (settlementCount === 0) {
      await SettlementModel.insertMany(seedSettlements);
    }

    const activityCount = await ActivityModel.countDocuments();
    if (activityCount === 0) {
      await ActivityModel.insertMany(seedActivities);
    }

    const notifCount = await NotificationModel.countDocuments();
    if (notifCount === 0) {
      await NotificationModel.insertMany(seedNotifications);
    }

    console.log('\n======================================================');
    console.log('🎉 [MONGODB] All SplitMate Collections Synced:');
    console.log(`👥 Users:         ${await UserModel.countDocuments()}`);
    console.log(`📂 Groups:        ${await GroupModel.countDocuments()}`);
    console.log(`🤝 Friends:       ${await FriendModel.countDocuments()}`);
    console.log(`💳 Expenses:      ${await ExpenseModel.countDocuments()}`);
    console.log(`⚖️  Settlements:   ${await SettlementModel.countDocuments()}`);
    console.log(`⚡ Activities:    ${await ActivityModel.countDocuments()}`);
    console.log(`🔔 Notifications: ${await NotificationModel.countDocuments()}`);
    console.log('======================================================\n');
  } catch (err: any) {
    console.error('❌ [MONGODB SEED ERROR]', err.message);
  }
};

