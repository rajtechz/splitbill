import { connectMongoDB } from './mongo.js';
import {
  UserModel,
  GroupModel,
  FriendModel,
  ExpenseModel,
  SettlementModel,
  ActivityModel,
  NotificationModel,
} from '../models/index.js';
import mongoose from 'mongoose';

const seed = async () => {
  console.log('🍃 Connecting and syncing all data into MongoDB Compass...');
  const ok = await connectMongoDB();
  if (!ok) {
    console.error('❌ Failed to connect to MongoDB at 127.0.0.1:27017');
    process.exit(1);
  }

  console.log('\n📊 SplitMate Database Status in MongoDB Compass:');
  console.log(`📍 URI:        mongodb://127.0.0.1:27017/splitmate`);
  console.log(`📦 Database:   splitmate`);
  console.log('------------------------------------------------------');
  console.log(`👥 users:         ${await UserModel.countDocuments()}`);
  console.log(`📂 groups:        ${await GroupModel.countDocuments()}`);
  console.log(`🤝 friends:       ${await FriendModel.countDocuments()}`);
  console.log(`💳 expenses:      ${await ExpenseModel.countDocuments()}`);
  console.log(`⚖️  settlements:   ${await SettlementModel.countDocuments()}`);
  console.log(`⚡ activities:    ${await ActivityModel.countDocuments()}`);
  console.log(`🔔 notifications: ${await NotificationModel.countDocuments()}`);
  console.log('------------------------------------------------------');
  console.log('🎉 Open MongoDB Compass and refresh to see the "splitmate" database and all 7 collections!\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => {
  console.error(err);
  process.exit(1);
});

