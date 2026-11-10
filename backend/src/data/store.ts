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
    return this.data.groups[idx];
  }

  deleteGroup(id: string): boolean {
    const lenBefore = this.data.groups.length;
    this.data.groups = this.data.groups.filter(g => g.id !== id);
    this.persist();
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
    return friend;
  }

  deleteFriend(id: string): boolean {
    const lenBefore = this.data.friends.length;
    this.data.friends = this.data.friends.filter(f => f.id !== id);
    this.persist();
    return this.data.friends.length < lenBefore;
  }

  updateFriend(id: string, updates: Partial<Friend>): Friend | null {
    const idx = this.data.friends.findIndex(f => f.id === id);
    if (idx === -1) return null;
    this.data.friends[idx] = { ...this.data.friends[idx], ...updates };
    this.persist();
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
    return this.data.expenses[idx];
  }

  deleteExpense(id: string): boolean {
    const lenBefore = this.data.expenses.length;
    this.data.expenses = this.data.expenses.filter(e => e.id !== id);
    this.persist();
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
    return settlement;
  }

  updateSettlementStatus(id: string, status: 'CONFIRMED' | 'REJECTED'): Settlement | null {
    const settlement = this.findSettlementById(id);
    if (!settlement) return null;
    settlement.status = status;
    this.persist();
    return settlement;
  }

  // --- Activities ---
  getActivities(): Activity[] {
    return [...this.data.activities];
  }

  createActivity(activity: Activity): Activity {
    this.data.activities.unshift(activity);
    this.persist();
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
    return true;
  }

  createNotification(notif: AppNotification): AppNotification {
    this.data.notifications.unshift(notif);
    this.persist();
    return notif;
  }
}

export const store = new Store();
