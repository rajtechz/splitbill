"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.store = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const seedData_js_1 = require("./seedData.js");
const index_js_1 = require("../models/index.js");
const mongo_js_1 = require("../database/mongo.js");
const DATA_DIR = path_1.default.resolve(process.cwd(), 'data');
const DB_FILE = path_1.default.join(DATA_DIR, 'db.json');
class Store {
    data;
    saveTimeout = null;
    constructor() {
        this.data = this.loadDatabase();
    }
    loadDatabase() {
        try {
            if (fs_1.default.existsSync(DB_FILE)) {
                const raw = fs_1.default.readFileSync(DB_FILE, 'utf-8');
                const parsed = JSON.parse(raw);
                console.log('[SplitMate DB] Loaded existing database from', DB_FILE);
                return {
                    users: parsed.users || seedData_js_1.SEED_USERS,
                    friends: parsed.friends || seedData_js_1.SEED_FRIENDS,
                    groups: parsed.groups || seedData_js_1.SEED_GROUPS,
                    expenses: parsed.expenses || seedData_js_1.SEED_EXPENSES,
                    settlements: parsed.settlements || seedData_js_1.SEED_SETTLEMENTS,
                    activities: parsed.activities || seedData_js_1.SEED_ACTIVITIES,
                    notifications: parsed.notifications || seedData_js_1.SEED_NOTIFICATIONS,
                };
            }
        }
        catch (err) {
            console.warn('[SplitMate DB] Failed to read db.json, initializing from seeds:', err);
        }
        console.log('[SplitMate DB] Initializing fresh database with seed data');
        const freshDb = {
            users: [...seedData_js_1.SEED_USERS],
            friends: [...seedData_js_1.SEED_FRIENDS],
            groups: [...seedData_js_1.SEED_GROUPS],
            expenses: [...seedData_js_1.SEED_EXPENSES],
            settlements: [...seedData_js_1.SEED_SETTLEMENTS],
            activities: [...seedData_js_1.SEED_ACTIVITIES],
            notifications: [...seedData_js_1.SEED_NOTIFICATIONS],
        };
        this.scheduleSave(freshDb);
        return freshDb;
    }
    async reloadFromMongo() {
        if (!(0, mongo_js_1.isMongoConnected)())
            return;
        try {
            const [users, groups, friends, expenses, settlements, activities, notifications] = await Promise.all([
                index_js_1.UserModel.find().lean(),
                index_js_1.GroupModel.find().lean(),
                index_js_1.FriendModel.find().lean(),
                index_js_1.ExpenseModel.find().lean(),
                index_js_1.SettlementModel.find().lean(),
                index_js_1.ActivityModel.find().lean(),
                index_js_1.NotificationModel.find().lean(),
            ]);
            if (users.length > 0)
                this.data.users = users;
            if (groups.length > 0)
                this.data.groups = groups;
            if (friends.length > 0)
                this.data.friends = friends;
            if (expenses.length > 0)
                this.data.expenses = expenses;
            if (settlements.length > 0)
                this.data.settlements = settlements;
            if (activities.length > 0)
                this.data.activities = activities;
            if (notifications.length > 0)
                this.data.notifications = notifications;
            this.scheduleSave();
            console.log('🔄 [SplitMate DB] Synchronized in-memory store with MongoDB collections');
        }
        catch (err) {
            console.warn('⚠️ [SplitMate DB] Could not sync from MongoDB:', err.message);
        }
    }
    scheduleSave(dataToSave) {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        this.saveTimeout = setTimeout(() => {
            try {
                if (!fs_1.default.existsSync(DATA_DIR)) {
                    fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
                }
                fs_1.default.writeFileSync(DB_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
            }
            catch (err) {
                console.error('[SplitMate DB] Failed to persist db.json:', err);
            }
        }, 200);
    }
    persist() {
        this.scheduleSave();
    }
    // --- Users ---
    findUserById(id) {
        return this.data.users.find(u => u.id === id);
    }
    findUserByEmail(email) {
        const clean = email.trim().toLowerCase();
        return this.data.users.find(u => u.email.toLowerCase() === clean);
    }
    findUserByPhone(phone) {
        const clean = phone.replace(/\s+/g, '');
        return this.data.users.find(u => u.phoneNumber?.replace(/\s+/g, '') === clean);
    }
    createUser(user) {
        this.data.users.push(user);
        this.persist();
        if ((0, mongo_js_1.isMongoConnected)()) {
            index_js_1.UserModel.create(user).catch(err => {
                console.warn('⚠️ [MONGODB WRITE ERROR - USER]', err.message);
            });
        }
        return user;
    }
    updateUser(id, updates) {
        const idx = this.data.users.findIndex(u => u.id === id);
        if (idx === -1)
            return null;
        this.data.users[idx] = {
            ...this.data.users[idx],
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        this.persist();
        if ((0, mongo_js_1.isMongoConnected)()) {
            index_js_1.UserModel.updateOne({ id }, { $set: updates }).catch(err => {
                console.warn('⚠️ [MONGODB UPDATE ERROR - USER]', err.message);
            });
        }
        return this.data.users[idx];
    }
    // --- Groups ---
    getGroups() {
        return [...this.data.groups];
    }
    findGroupById(id) {
        return this.data.groups.find(g => g.id === id);
    }
    createGroup(group) {
        this.data.groups.unshift(group);
        this.persist();
        if ((0, mongo_js_1.isMongoConnected)()) {
            index_js_1.GroupModel.create(group).catch(err => {
                console.warn('⚠️ [MONGODB WRITE ERROR - GROUP]', err.message);
            });
        }
        return group;
    }
    updateGroup(id, updates) {
        const idx = this.data.groups.findIndex(g => g.id === id);
        if (idx === -1)
            return null;
        this.data.groups[idx] = {
            ...this.data.groups[idx],
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        this.persist();
        if ((0, mongo_js_1.isMongoConnected)()) {
            index_js_1.GroupModel.updateOne({ id }, { $set: updates }).catch(err => {
                console.warn('⚠️ [MONGODB UPDATE ERROR - GROUP]', err.message);
            });
        }
        return this.data.groups[idx];
    }
    deleteGroup(id) {
        const lenBefore = this.data.groups.length;
        this.data.groups = this.data.groups.filter(g => g.id !== id);
        this.persist();
        if ((0, mongo_js_1.isMongoConnected)()) {
            index_js_1.GroupModel.deleteOne({ id }).catch(err => {
                console.warn('⚠️ [MONGODB DELETE ERROR - GROUP]', err.message);
            });
        }
        return this.data.groups.length < lenBefore;
    }
    addGroupMember(groupId, member) {
        const group = this.findGroupById(groupId);
        if (!group)
            return null;
        const exists = group.members.some(m => m.userId === member.userId);
        if (!exists) {
            group.members.push(member);
            group.membersCount = group.members.length;
            group.updatedAt = new Date().toISOString();
            this.persist();
            if ((0, mongo_js_1.isMongoConnected)()) {
                index_js_1.GroupModel.updateOne({ id: groupId }, { $set: { members: group.members, membersCount: group.membersCount, updatedAt: group.updatedAt } }).catch(() => { });
            }
        }
        return group;
    }
    removeGroupMember(groupId, userId) {
        const group = this.findGroupById(groupId);
        if (!group)
            return null;
        group.members = group.members.filter(m => m.userId !== userId);
        group.membersCount = group.members.length;
        group.updatedAt = new Date().toISOString();
        this.persist();
        if ((0, mongo_js_1.isMongoConnected)()) {
            index_js_1.GroupModel.updateOne({ id: groupId }, { $set: { members: group.members, membersCount: group.membersCount, updatedAt: group.updatedAt } }).catch(() => { });
        }
        return group;
    }
    // --- Friends ---
    getFriends() {
        return [...this.data.friends];
    }
    findFriendById(id) {
        return this.data.friends.find(f => f.id === id);
    }
    createFriend(friend) {
        this.data.friends.unshift(friend);
        this.persist();
        if ((0, mongo_js_1.isMongoConnected)()) {
            index_js_1.FriendModel.create(friend).catch(err => {
                console.warn('⚠️ [MONGODB WRITE ERROR - FRIEND]', err.message);
            });
        }
        return friend;
    }
    deleteFriend(id) {
        const lenBefore = this.data.friends.length;
        this.data.friends = this.data.friends.filter(f => f.id !== id);
        this.persist();
        if ((0, mongo_js_1.isMongoConnected)()) {
            index_js_1.FriendModel.deleteOne({ id }).catch(err => {
                console.warn('⚠️ [MONGODB DELETE ERROR - FRIEND]', err.message);
            });
        }
        return this.data.friends.length < lenBefore;
    }
    updateFriend(id, updates) {
        const idx = this.data.friends.findIndex(f => f.id === id);
        if (idx === -1)
            return null;
        this.data.friends[idx] = { ...this.data.friends[idx], ...updates };
        this.persist();
        if ((0, mongo_js_1.isMongoConnected)()) {
            index_js_1.FriendModel.updateOne({ id }, { $set: updates }).catch(() => { });
        }
        return this.data.friends[idx];
    }
    // --- Expenses ---
    getExpenses(groupId) {
        if (groupId) {
            return this.data.expenses.filter(e => e.groupId === groupId);
        }
        return [...this.data.expenses];
    }
    findExpenseById(id) {
        return this.data.expenses.find(e => e.id === id);
    }
    createExpense(expense) {
        this.data.expenses.unshift(expense);
        this.persist();
        if ((0, mongo_js_1.isMongoConnected)()) {
            index_js_1.ExpenseModel.create(expense).catch(err => {
                console.warn('⚠️ [MONGODB WRITE ERROR - EXPENSE]', err.message);
            });
        }
        return expense;
    }
    updateExpense(id, updates) {
        const idx = this.data.expenses.findIndex(e => e.id === id);
        if (idx === -1)
            return null;
        this.data.expenses[idx] = {
            ...this.data.expenses[idx],
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        this.persist();
        if ((0, mongo_js_1.isMongoConnected)()) {
            index_js_1.ExpenseModel.updateOne({ id }, { $set: updates }).catch(err => {
                console.warn('⚠️ [MONGODB UPDATE ERROR - EXPENSE]', err.message);
            });
        }
        return this.data.expenses[idx];
    }
    deleteExpense(id) {
        const lenBefore = this.data.expenses.length;
        this.data.expenses = this.data.expenses.filter(e => e.id !== id);
        this.persist();
        if ((0, mongo_js_1.isMongoConnected)()) {
            index_js_1.ExpenseModel.deleteOne({ id }).catch(err => {
                console.warn('⚠️ [MONGODB DELETE ERROR - EXPENSE]', err.message);
            });
        }
        return this.data.expenses.length < lenBefore;
    }
    addCommentToExpense(expenseId, comment) {
        const expense = this.findExpenseById(expenseId);
        if (!expense)
            return null;
        if (!expense.comments) {
            expense.comments = [];
        }
        expense.comments.push(comment);
        expense.commentsCount = expense.comments.length;
        expense.updatedAt = new Date().toISOString();
        this.persist();
        if ((0, mongo_js_1.isMongoConnected)()) {
            index_js_1.ExpenseModel.updateOne({ id: expenseId }, { $set: { comments: expense.comments, commentsCount: expense.commentsCount, updatedAt: expense.updatedAt } }).catch(() => { });
        }
        return expense;
    }
    // --- Settlements ---
    getSettlements(groupId) {
        if (groupId) {
            return this.data.settlements.filter(s => s.groupId === groupId);
        }
        return [...this.data.settlements];
    }
    findSettlementById(id) {
        return this.data.settlements.find(s => s.id === id);
    }
    createSettlement(settlement) {
        this.data.settlements.unshift(settlement);
        this.persist();
        if ((0, mongo_js_1.isMongoConnected)()) {
            index_js_1.SettlementModel.create(settlement).catch(err => {
                console.warn('⚠️ [MONGODB WRITE ERROR - SETTLEMENT]', err.message);
            });
        }
        return settlement;
    }
    updateSettlementStatus(id, status) {
        const settlement = this.findSettlementById(id);
        if (!settlement)
            return null;
        settlement.status = status;
        this.persist();
        if ((0, mongo_js_1.isMongoConnected)()) {
            index_js_1.SettlementModel.updateOne({ id }, { $set: { status } }).catch(err => {
                console.warn('⚠️ [MONGODB UPDATE ERROR - SETTLEMENT]', err.message);
            });
        }
        return settlement;
    }
    // --- Activities ---
    getActivities() {
        return [...this.data.activities];
    }
    createActivity(activity) {
        this.data.activities.unshift(activity);
        this.persist();
        if ((0, mongo_js_1.isMongoConnected)()) {
            index_js_1.ActivityModel.create(activity).catch(err => {
                console.warn('⚠️ [MONGODB WRITE ERROR - ACTIVITY]', err.message);
            });
        }
        return activity;
    }
    // --- Notifications ---
    getNotifications() {
        return [...this.data.notifications];
    }
    markNotificationAsRead(id) {
        const notif = this.data.notifications.find(n => n.id === id);
        if (!notif)
            return false;
        notif.read = true;
        this.persist();
        if ((0, mongo_js_1.isMongoConnected)()) {
            index_js_1.NotificationModel.updateOne({ id }, { $set: { read: true } }).catch(() => { });
        }
        return true;
    }
    markAllNotificationsAsRead() {
        for (const notif of this.data.notifications) {
            notif.read = true;
        }
        this.persist();
        if ((0, mongo_js_1.isMongoConnected)()) {
            index_js_1.NotificationModel.updateMany({}, { $set: { read: true } }).catch(() => { });
        }
    }
    createNotification(notif) {
        this.data.notifications.unshift(notif);
        this.persist();
        if ((0, mongo_js_1.isMongoConnected)()) {
            index_js_1.NotificationModel.create(notif).catch(err => {
                console.warn('⚠️ [MONGODB WRITE ERROR - NOTIFICATION]', err.message);
            });
        }
        return notif;
    }
    // --- Security & mPIN ---
    setMpin(userId, pin) {
        const user = this.findUserById(userId);
        if (!user)
            return false;
        user.mPin = pin;
        user.isPinEnabled = true;
        this.persist();
        if ((0, mongo_js_1.isMongoConnected)()) {
            index_js_1.UserModel.updateOne({ id: userId }, { $set: { mPin: pin, isPinEnabled: true } }).catch(() => { });
        }
        return true;
    }
    verifyMpin(userId, pin) {
        const user = this.findUserById(userId);
        if (!user)
            return false;
        // Default fallback '1234' or exact match
        return (user.mPin && user.mPin === pin) || pin === '1234';
    }
    toggleBiometrics(userId, enabled) {
        const user = this.findUserById(userId);
        if (!user)
            return false;
        user.isBiometricsEnabled = enabled !== undefined ? enabled : !user.isBiometricsEnabled;
        this.persist();
        if ((0, mongo_js_1.isMongoConnected)()) {
            index_js_1.UserModel.updateOne({ id: userId }, { $set: { isBiometricsEnabled: user.isBiometricsEnabled } }).catch(() => { });
        }
        return user.isBiometricsEnabled ?? true;
    }
    // --- Contacts Matching ---
    matchContacts(contacts) {
        return contacts.map(c => {
            const cleanPhoneDigits = c.phoneNumber ? c.phoneNumber.replace(/[^0-9]/g, '').slice(-10) : '';
            const cleanEmail = c.email?.trim().toLowerCase();
            const matchedUser = this.data.users.find(u => {
                if (cleanPhoneDigits && u.phoneNumber) {
                    const userPhoneDigits = u.phoneNumber.replace(/[^0-9]/g, '').slice(-10);
                    if (userPhoneDigits && userPhoneDigits === cleanPhoneDigits)
                        return true;
                }
                if (cleanEmail && u.email.toLowerCase() === cleanEmail)
                    return true;
                return false;
            });
            if (matchedUser) {
                const { passwordHash: _, mPin: __, ...safeUser } = matchedUser;
                return {
                    contactName: c.name,
                    phoneNumber: c.phoneNumber,
                    email: c.email,
                    isRegistered: true,
                    user: safeUser,
                };
            }
            return {
                contactName: c.name,
                phoneNumber: c.phoneNumber,
                email: c.email,
                isRegistered: false,
            };
        });
    }
}
exports.store = new Store();
