"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.store = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const seedData_js_1 = require("./seedData.js");
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
        return this.data.groups[idx];
    }
    deleteGroup(id) {
        const lenBefore = this.data.groups.length;
        this.data.groups = this.data.groups.filter(g => g.id !== id);
        this.persist();
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
        return friend;
    }
    deleteFriend(id) {
        const lenBefore = this.data.friends.length;
        this.data.friends = this.data.friends.filter(f => f.id !== id);
        this.persist();
        return this.data.friends.length < lenBefore;
    }
    updateFriend(id, updates) {
        const idx = this.data.friends.findIndex(f => f.id === id);
        if (idx === -1)
            return null;
        this.data.friends[idx] = { ...this.data.friends[idx], ...updates };
        this.persist();
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
        return this.data.expenses[idx];
    }
    deleteExpense(id) {
        const lenBefore = this.data.expenses.length;
        this.data.expenses = this.data.expenses.filter(e => e.id !== id);
        this.persist();
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
        return settlement;
    }
    updateSettlementStatus(id, status) {
        const settlement = this.findSettlementById(id);
        if (!settlement)
            return null;
        settlement.status = status;
        this.persist();
        return settlement;
    }
    // --- Activities ---
    getActivities() {
        return [...this.data.activities];
    }
    createActivity(activity) {
        this.data.activities.unshift(activity);
        this.persist();
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
        return true;
    }
    createNotification(notif) {
        this.data.notifications.unshift(notif);
        this.persist();
        return notif;
    }
}
exports.store = new Store();
