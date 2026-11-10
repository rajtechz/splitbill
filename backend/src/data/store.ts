import fs from 'fs';
import path from 'path';
import {
  User,
  Friend,
  Group,
  GroupMember,
  Expense,
  ExpenseComment,
  Settlement,
  Activity,
  AppNotification,
} from '../types/index.js';
import {
  SEED_USERS,
  SEED_FRIENDS,
  SEED_GROUPS,
  SEED_EXPENSES,
  SEED_SETTLEMENTS,
  SEED_ACTIVITIES,
  SEED_NOTIFICATIONS,
} from './seedData.js';
import {
  UserModel,
  GroupModel,
  FriendModel,
  ExpenseModel,
  SettlementModel,
  ActivityModel,
  NotificationModel,
} from '../models/index.js';
import { isMongoConnected } from '../database/mongo.js';

interface DatabaseSchema {
  users: User[];
  friends: Friend[];
  groups: Group[];
  expenses: Expense[];
  settlements: Settlement[];
  activities: Activity[];
  notifications: AppNotification[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class Store {
  private data: DatabaseSchema;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        console.log('[SplitMate DB] Loaded existing database from', DB_FILE);
        return {
          users: parsed.users || SEED_USERS,
          friends: parsed.friends || SEED_FRIENDS,
          groups: parsed.groups || SEED_GROUPS,
          expenses: parsed.expenses || SEED_EXPENSES,
          settlements: parsed.settlements || SEED_SETTLEMENTS,
          activities: parsed.activities || SEED_ACTIVITIES,
          notifications: parsed.notifications || SEED_NOTIFICATIONS,
        };
      }
    } catch (err) {
      console.warn('[SplitMate DB] Failed to read db.json, initializing from seeds:', err);
    }

    console.log('[SplitMate DB] Initializing fresh database with seed data');
    const freshDb: DatabaseSchema = {
      users: [...SEED_USERS],
      friends: [...SEED_FRIENDS],
      groups: [...SEED_GROUPS],
      expenses: [...SEED_EXPENSES],
      settlements: [...SEED_SETTLEMENTS],
      activities: [...SEED_ACTIVITIES],
      notifications: [...SEED_NOTIFICATIONS],
    };
    this.scheduleSave(freshDb);
    return freshDb;
  }

  public async reloadFromMongo(): Promise<void> {
    if (!isMongoConnected()) return;
    try {
      const [users, groups, friends, expenses, settlements, activities, notifications] =
        await Promise.all([
          UserModel.find().lean(),
          GroupModel.find().lean(),
          FriendModel.find().lean(),
          ExpenseModel.find().lean(),
          SettlementModel.find().lean(),
          ActivityModel.find().lean(),
          NotificationModel.find().lean(),
        ]);

      if (users.length > 0) this.data.users = users as any;
      if (groups.length > 0) this.data.groups = groups as any;
      if (friends.length > 0) this.data.friends = friends as any;
      if (expenses.length > 0) this.data.expenses = expenses as any;
      if (settlements.length > 0) this.data.settlements = settlements as any;
      if (activities.length > 0) this.data.activities = activities as any;
      if (notifications.length > 0) this.data.notifications = notifications as any;

      this.scheduleSave();
      console.log('🔄 [SplitMate DB] Synchronized in-memory store with MongoDB collections');
    } catch (err: any) {
      console.warn('⚠️ [SplitMate DB] Could not sync from MongoDB:', err.message);
    }
  }

  private scheduleSave(dataToSave?: DatabaseSchema) {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
      } catch (err) {
        console.error('[SplitMate DB] Failed to persist db.json:', err);
      }
    }, 200);
  }

  private persist() {
    this.scheduleSave();
  }

  // --- Users ---
  findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  findUserByEmail(email: string): User | undefined {
    const clean = email.trim().toLowerCase();
    return this.data.users.find(u => u.email.toLowerCase() === clean);
  }

  findUserByPhone(phone: string): User | undefined {
    const clean = phone.replace(/\s+/g, '');
    return this.data.users.find(u => u.phoneNumber?.replace(/\s+/g, '') === clean);
  }

  createUser(user: User): User {
    this.data.users.push(user);
    this.persist();

    if (isMongoConnected()) {
      UserModel.create(user).catch(err => {
        console.warn('⚠️ [MONGODB WRITE ERROR - USER]', err.message);
      });
    }
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();

    if (isMongoConnected()) {
      UserModel.updateOne({ id }, { $set: updates }).catch(err => {
        console.warn('⚠️ [MONGODB UPDATE ERROR - USER]', err.message);
      });
    }
    return this.data.users[idx];
  }

  // --- Groups ---
  getGroups(): Group[] {
    return [...this.data.groups];
  }

  findGroupById(id: string): Group | undefined {
    return this.data.groups.find(g => g.id === id);
  }

  createGroup(group: Group): Group {
    this.data.groups.unshift(group);
    this.persist();

    if (isMongoConnected()) {
      GroupModel.create(group).catch(err => {
        console.warn('⚠️ [MONGODB WRITE ERROR - GROUP]', err.message);
      });
    }
    return group;
  }

  updateGroup(id: string, updates: Partial<Group>): Group | null {
    const idx = this.data.groups.findIndex(g => g.id === id);
    if (idx === -1) return null;
    this.data.groups[idx] = {
      ...this.data.groups[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();

    if (isMongoConnected()) {
      GroupModel.updateOne({ id }, { $set: updates }).catch(err => {
        console.warn('⚠️ [MONGODB UPDATE ERROR - GROUP]', err.message);
      });
    }
    return this.data.groups[idx];
  }

  deleteGroup(id: string): boolean {
    const lenBefore = this.data.groups.length;
    this.data.groups = this.data.groups.filter(g => g.id !== id);
    this.persist();

    if (isMongoConnected()) {
      GroupModel.deleteOne({ id }).catch(err => {
        console.warn('⚠️ [MONGODB DELETE ERROR - GROUP]', err.message);
      });
    }
    return this.data.groups.length < lenBefore;
  }

  addGroupMember(groupId: string, member: GroupMember): Group | null {
    const group = this.findGroupById(groupId);
    if (!group) return null;

    const exists = group.members.some(m => m.userId === member.userId);
    if (!exists) {
      group.members.push(member);
      group.membersCount = group.members.length;
      group.updatedAt = new Date().toISOString();
      this.persist();

      if (isMongoConnected()) {
        GroupModel.updateOne(
          { id: groupId },
          { $set: { members: group.members, membersCount: group.membersCount, updatedAt: group.updatedAt } }
        ).catch(() => {});
      }
    }
    return group;
  }

  removeGroupMember(groupId: string, userId: string): Group | null {
    const group = this.findGroupById(groupId);
    if (!group) return null;

    group.members = group.members.filter(m => m.userId !== userId);
    group.membersCount = group.members.length;
    group.updatedAt = new Date().toISOString();
    this.persist();

    if (isMongoConnected()) {
      GroupModel.updateOne(
        { id: groupId },
        { $set: { members: group.members, membersCount: group.membersCount, updatedAt: group.updatedAt } }
      ).catch(() => {});
    }
    return group;
  }

  // --- Friends ---
  getFriends(): Friend[] {
    return [...this.data.friends];
  }

  findFriendById(id: string): Friend | undefined {
    return this.data.friends.find(f => f.id === id);
  }

  createFriend(friend: Friend): Friend {
    this.data.friends.unshift(friend);
    this.persist();

    if (isMongoConnected()) {
      FriendModel.create(friend).catch(err => {
        console.warn('⚠️ [MONGODB WRITE ERROR - FRIEND]', err.message);
      });
    }
    return friend;
  }

  deleteFriend(id: string): boolean {
    const lenBefore = this.data.friends.length;
    this.data.friends = this.data.friends.filter(f => f.id !== id);
    this.persist();

    if (isMongoConnected()) {
      FriendModel.deleteOne({ id }).catch(err => {
        console.warn('⚠️ [MONGODB DELETE ERROR - FRIEND]', err.message);
      });
    }
    return this.data.friends.length < lenBefore;
  }

  updateFriend(id: string, updates: Partial<Friend>): Friend | null {
    const idx = this.data.friends.findIndex(f => f.id === id);
    if (idx === -1) return null;
    this.data.friends[idx] = { ...this.data.friends[idx], ...updates };
    this.persist();

    if (isMongoConnected()) {
      FriendModel.updateOne({ id }, { $set: updates }).catch(() => {});
    }
    return this.data.friends[idx];
  }

  // --- Expenses ---
  getExpenses(groupId?: string): Expense[] {
    if (groupId) {
      return this.data.expenses.filter(e => e.groupId === groupId);
    }
    return [...this.data.expenses];
  }

  findExpenseById(id: string): Expense | undefined {
    return this.data.expenses.find(e => e.id === id);
  }

  createExpense(expense: Expense): Expense {
    this.data.expenses.unshift(expense);
    this.persist();

    if (isMongoConnected()) {
      ExpenseModel.create(expense).catch(err => {
        console.warn('⚠️ [MONGODB WRITE ERROR - EXPENSE]', err.message);
      });
    }
    return expense;
  }

  updateExpense(id: string, updates: Partial<Expense>): Expense | null {
    const idx = this.data.expenses.findIndex(e => e.id === id);
    if (idx === -1) return null;
    this.data.expenses[idx] = {
      ...this.data.expenses[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();

    if (isMongoConnected()) {
      ExpenseModel.updateOne({ id }, { $set: updates }).catch(err => {
        console.warn('⚠️ [MONGODB UPDATE ERROR - EXPENSE]', err.message);
      });
    }
    return this.data.expenses[idx];
  }

  deleteExpense(id: string): boolean {
    const lenBefore = this.data.expenses.length;
    this.data.expenses = this.data.expenses.filter(e => e.id !== id);
    this.persist();

    if (isMongoConnected()) {
      ExpenseModel.deleteOne({ id }).catch(err => {
        console.warn('⚠️ [MONGODB DELETE ERROR - EXPENSE]', err.message);
      });
    }
    return this.data.expenses.length < lenBefore;
  }

  addCommentToExpense(expenseId: string, comment: ExpenseComment): Expense | null {
    const expense = this.findExpenseById(expenseId);
    if (!expense) return null;

    if (!expense.comments) {
      expense.comments = [];
    }
    expense.comments.push(comment);
    expense.commentsCount = expense.comments.length;
    expense.updatedAt = new Date().toISOString();
    this.persist();

    if (isMongoConnected()) {
      ExpenseModel.updateOne(
        { id: expenseId },
        { $set: { comments: expense.comments, commentsCount: expense.commentsCount, updatedAt: expense.updatedAt } }
      ).catch(() => {});
    }
    return expense;
  }

  // --- Settlements ---
  getSettlements(groupId?: string): Settlement[] {
    if (groupId) {
      return this.data.settlements.filter(s => s.groupId === groupId);
    }
    return [...this.data.settlements];
  }

  findSettlementById(id: string): Settlement | undefined {
    return this.data.settlements.find(s => s.id === id);
  }

  createSettlement(settlement: Settlement): Settlement {
    this.data.settlements.unshift(settlement);
    this.persist();

    if (isMongoConnected()) {
      SettlementModel.create(settlement).catch(err => {
        console.warn('⚠️ [MONGODB WRITE ERROR - SETTLEMENT]', err.message);
      });
    }
    return settlement;
  }

  updateSettlementStatus(id: string, status: 'CONFIRMED' | 'REJECTED'): Settlement | null {
    const settlement = this.findSettlementById(id);
    if (!settlement) return null;
    settlement.status = status;
    this.persist();

    if (isMongoConnected()) {
      SettlementModel.updateOne({ id }, { $set: { status } }).catch(err => {
        console.warn('⚠️ [MONGODB UPDATE ERROR - SETTLEMENT]', err.message);
      });
    }
    return settlement;
  }

  // --- Activities ---
  getActivities(): Activity[] {
    return [...this.data.activities];
  }

  createActivity(activity: Activity): Activity {
    this.data.activities.unshift(activity);
    this.persist();

    if (isMongoConnected()) {
      ActivityModel.create(activity).catch(err => {
        console.warn('⚠️ [MONGODB WRITE ERROR - ACTIVITY]', err.message);
      });
    }
    return activity;
  }

  // --- Notifications ---
  getNotifications(): AppNotification[] {
    return [...this.data.notifications];
  }

  markNotificationAsRead(id: string): boolean {
    const notif = this.data.notifications.find(n => n.id === id);
    if (!notif) return false;
    notif.read = true;
    this.persist();

    if (isMongoConnected()) {
      NotificationModel.updateOne({ id }, { $set: { read: true } }).catch(() => {});
    }
    return true;
  }

  markAllNotificationsAsRead(): void {
    for (const notif of this.data.notifications) {
      notif.read = true;
    }
    this.persist();

    if (isMongoConnected()) {
      NotificationModel.updateMany({}, { $set: { read: true } }).catch(() => {});
    }
  }

  createNotification(notif: AppNotification): AppNotification {
    this.data.notifications.unshift(notif);
    this.persist();

    if (isMongoConnected()) {
      NotificationModel.create(notif).catch(err => {
        console.warn('⚠️ [MONGODB WRITE ERROR - NOTIFICATION]', err.message);
      });
    }
    return notif;
  }

  // --- Security & mPIN ---
  setMpin(userId: string, pin: string): boolean {
    const user = this.findUserById(userId);
    if (!user) return false;
    user.mPin = pin;
    user.isPinEnabled = true;
    this.persist();

    if (isMongoConnected()) {
      UserModel.updateOne({ id: userId }, { $set: { mPin: pin, isPinEnabled: true } }).catch(() => {});
    }
    return true;
  }

  verifyMpin(userId: string, pin: string): boolean {
    const user = this.findUserById(userId);
    if (!user) return false;
    // Default fallback '1234' or exact match
    return (user.mPin && user.mPin === pin) || pin === '1234';
  }

  toggleBiometrics(userId: string, enabled?: boolean): boolean {
    const user = this.findUserById(userId);
    if (!user) return false;
    user.isBiometricsEnabled = enabled !== undefined ? enabled : !user.isBiometricsEnabled;
    this.persist();

    if (isMongoConnected()) {
      UserModel.updateOne({ id: userId }, { $set: { isBiometricsEnabled: user.isBiometricsEnabled } }).catch(() => {});
    }
    return user.isBiometricsEnabled ?? true;
  }

  // --- Contacts Matching ---
  matchContacts(contacts: Array<{ name: string; phoneNumber?: string; email?: string }>) {
    return contacts.map(c => {
      const cleanPhoneDigits = c.phoneNumber ? c.phoneNumber.replace(/[^0-9]/g, '').slice(-10) : '';
      const cleanEmail = c.email?.trim().toLowerCase();

      const matchedUser = this.data.users.find(u => {
        if (cleanPhoneDigits && u.phoneNumber) {
          const userPhoneDigits = u.phoneNumber.replace(/[^0-9]/g, '').slice(-10);
          if (userPhoneDigits && userPhoneDigits === cleanPhoneDigits) return true;
        }
        if (cleanEmail && u.email.toLowerCase() === cleanEmail) return true;
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

export const store = new Store();
