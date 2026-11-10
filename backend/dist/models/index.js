"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModel = exports.ActivityModel = exports.SettlementModel = exports.ExpenseModel = exports.FriendModel = exports.GroupModel = exports.UserModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// 1. User Schema
const UserSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String },
    phoneNumber: { type: String, index: true },
    upiId: { type: String },
    avatarUrl: { type: String },
    defaultCurrency: { type: String, default: 'INR' },
    country: { type: String, default: 'IN' },
    mPin: { type: String, default: '1234' },
    isPinEnabled: { type: Boolean, default: true },
    isBiometricsEnabled: { type: Boolean, default: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String },
}, { timestamps: false, versionKey: false });
// 2. Group Schema
const GroupSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, default: 'Other' },
    currency: { type: String, default: 'INR' },
    avatarUrl: { type: String },
    membersCount: { type: Number, default: 0 },
    totalSpending: { type: Number, default: 0 },
    userBalance: { type: Number, default: 0 },
    members: [
        {
            userId: { type: String, required: true },
            name: { type: String, required: true },
            email: { type: String, required: true },
            avatarUrl: { type: String },
            role: { type: String, default: 'member' },
            joinedAt: { type: String, required: true },
            netBalance: { type: Number, default: 0 },
        },
    ],
    createdBy: { type: String, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String },
    archived: { type: Boolean, default: false },
}, { timestamps: false, versionKey: false });
// 3. Friend Schema
const FriendSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String },
    upiId: { type: String },
    avatarUrl: { type: String },
    netBalance: { type: Number, default: 0 },
    createdAt: { type: String, required: true },
}, { timestamps: false, versionKey: false });
// 4. Expense Schema
const ExpenseSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    date: { type: String, required: true },
    category: { type: String, default: 'Other' },
    groupId: { type: String, default: null, index: true },
    groupName: { type: String },
    notes: { type: String },
    receiptUri: { type: String },
    createdBy: { type: String, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String },
    splitMethod: { type: String, default: 'EQUAL' },
    participants: [
        {
            userId: { type: String, required: true },
            name: { type: String, required: true },
            paidAmount: { type: Number, default: 0 },
            shareAmount: { type: Number, default: 0 },
            netBalance: { type: Number, default: 0 },
            percentage: { type: Number },
            shares: { type: Number },
            exactAmount: { type: Number },
        },
    ],
    commentsCount: { type: Number, default: 0 },
    comments: [
        {
            id: { type: String },
            expenseId: { type: String },
            userId: { type: String },
            userName: { type: String },
            userAvatar: { type: String },
            text: { type: String },
            createdAt: { type: String },
        },
    ],
}, { timestamps: false, versionKey: false });
// 5. Settlement Schema
const SettlementSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true, index: true },
    groupId: { type: String, default: null, index: true },
    groupName: { type: String },
    payerId: { type: String, required: true },
    payerName: { type: String, required: true },
    receiverId: { type: String, required: true },
    receiverName: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    date: { type: String, required: true },
    paymentMethod: { type: String, default: 'UPI' },
    status: { type: String, default: 'CONFIRMED' },
    referenceNumber: { type: String },
    notes: { type: String },
    receiptUri: { type: String },
    createdAt: { type: String, required: true },
}, { timestamps: false, versionKey: false });
// 6. Activity Schema
const ActivitySchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true },
    actorId: { type: String, required: true },
    actorName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    timestamp: { type: String, required: true },
    amount: { type: Number },
    currency: { type: String },
    groupId: { type: String },
    expenseId: { type: String },
}, { timestamps: false, versionKey: false });
// 7. Notification Schema
const NotificationSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true },
    recipientId: { type: String, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    message: { type: String },
    timestamp: { type: String, required: true },
    read: { type: Boolean, default: false },
    actionData: { type: mongoose_1.Schema.Types.Mixed },
}, { timestamps: false, versionKey: false });
exports.UserModel = mongoose_1.default.models.User || mongoose_1.default.model('User', UserSchema, 'users');
exports.GroupModel = mongoose_1.default.models.Group || mongoose_1.default.model('Group', GroupSchema, 'groups');
exports.FriendModel = mongoose_1.default.models.Friend || mongoose_1.default.model('Friend', FriendSchema, 'friends');
exports.ExpenseModel = mongoose_1.default.models.Expense || mongoose_1.default.model('Expense', ExpenseSchema, 'expenses');
exports.SettlementModel = mongoose_1.default.models.Settlement || mongoose_1.default.model('Settlement', SettlementSchema, 'settlements');
exports.ActivityModel = mongoose_1.default.models.Activity || mongoose_1.default.model('Activity', ActivitySchema, 'activities');
exports.NotificationModel = mongoose_1.default.models.Notification || mongoose_1.default.model('Notification', NotificationSchema, 'notifications');
