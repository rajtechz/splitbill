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
} from '../../types';
import {
  CURRENT_USER,
  INITIAL_FRIENDS,
  INITIAL_GROUPS,
  INITIAL_EXPENSES,
  INITIAL_SETTLEMENTS,
  INITIAL_ACTIVITIES,
  INITIAL_NOTIFICATIONS,
} from './mockData';
import { storage } from '../storage';
import { calculateBalances, calculateUserBalance } from '../..//features/balances/calculations/debtEngine';
import { config } from '../../app/config';
import { HttpRepository } from './httpRepository';

export interface ISplitMateRepository {
  getCurrentUser(): Promise<User>;
  updateUserProfile(data: Partial<User>): Promise<User>;

  getGroups(): Promise<Group[]>;
  getGroupById(id: string): Promise<Group | null>;
  createGroup(data: Omit<Group, 'id' | 'createdAt' | 'totalSpending' | 'userBalance'>): Promise<Group>;
  updateGroup(id: string, data: Partial<Group>): Promise<Group>;
  deleteGroup(id: string): Promise<boolean>;
  addMemberToGroup(groupId: string, member: GroupMember): Promise<Group>;
  removeMemberFromGroup(groupId: string, userId: string): Promise<Group>;

  getFriends(): Promise<Friend[]>;
  addFriend(data: Omit<Friend, 'id' | 'createdAt' | 'netBalance'>): Promise<Friend>;
  removeFriend(id: string): Promise<boolean>;

  getExpenses(groupId?: string): Promise<Expense[]>;
  getExpenseById(id: string): Promise<Expense | null>;
  createExpense(data: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense>;
  updateExpense(id: string, data: Partial<Expense>): Promise<Expense>;
  deleteExpense(id: string): Promise<boolean>;
  addCommentToExpense(expenseId: string, text: string): Promise<Expense>;

  getSettlements(groupId?: string): Promise<Settlement[]>;
  recordSettlement(data: Omit<Settlement, 'id' | 'createdAt'>): Promise<Settlement>;
  confirmSettlement(id: string): Promise<Settlement>;
  rejectSettlement(id: string): Promise<Settlement>;

  getActivities(): Promise<Activity[]>;
  getNotifications(): Promise<AppNotification[]>;
  markNotificationAsRead(id: string): Promise<void>;

  search(query: string): Promise<{
    groups: Group[];
    friends: Friend[];
    expenses: Expense[];
  }>;
}

class LocalPersistentRepository implements ISplitMateRepository {
  private user: User = CURRENT_USER;
  private groups: Group[] = [...INITIAL_GROUPS];
  private friends: Friend[] = [...INITIAL_FRIENDS];
  private expenses: Expense[] = [...INITIAL_EXPENSES];
  private settlements: Settlement[] = [...INITIAL_SETTLEMENTS];
  private activities: Activity[] = [...INITIAL_ACTIVITIES];
  private notifications: AppNotification[] = [...INITIAL_NOTIFICATIONS];
  private initialized = false;

  private async ensureInitialized() {
    if (this.initialized) return;
    const cachedUser = await storage.getItem<User>(storage.STORAGE_KEYS.USER_SESSION);
    const cachedGroups = await storage.getItem<Group[]>(storage.STORAGE_KEYS.GROUPS_CACHE);
    const cachedFriends = await storage.getItem<Friend[]>(storage.STORAGE_KEYS.FRIENDS_CACHE);
    const cachedExpenses = await storage.getItem<Expense[]>(storage.STORAGE_KEYS.EXPENSES_CACHE);
    const cachedSettlements = await storage.getItem<Settlement[]>(storage.STORAGE_KEYS.SETTLEMENTS_CACHE);
    const cachedActivities = await storage.getItem<Activity[]>(storage.STORAGE_KEYS.ACTIVITIES_CACHE);

    if (cachedUser) this.user = cachedUser;
    if (cachedGroups) this.groups = cachedGroups;
    if (cachedFriends) this.friends = cachedFriends;
    if (cachedExpenses) this.expenses = cachedExpenses;
    if (cachedSettlements) this.settlements = cachedSettlements;
    if (cachedActivities) this.activities = cachedActivities;

    this.recalculateAllBalances();
    this.initialized = true;
  }

  private async persistState() {
    await Promise.all([
      storage.setItem(storage.STORAGE_KEYS.USER_SESSION, this.user),
      storage.setItem(storage.STORAGE_KEYS.GROUPS_CACHE, this.groups),
      storage.setItem(storage.STORAGE_KEYS.FRIENDS_CACHE, this.friends),
      storage.setItem(storage.STORAGE_KEYS.EXPENSES_CACHE, this.expenses),
      storage.setItem(storage.STORAGE_KEYS.SETTLEMENTS_CACHE, this.settlements),
      storage.setItem(storage.STORAGE_KEYS.ACTIVITIES_CACHE, this.activities),
    ]);
  }

  private recalculateAllBalances() {
    // Recalculate group balances
    this.groups = this.groups.map(grp => {
      const groupExpenses = this.expenses.filter(e => e.groupId === grp.id);
      const groupSettlements = this.settlements.filter(s => s.groupId === grp.id);
      const totalSpending = groupExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
      const userSummary = calculateUserBalance(this.user.id, groupExpenses, groupSettlements, grp.currency);

      return {
        ...grp,
        totalSpending,
        userBalance: userSummary.totalBalance,
      };
    });

    // Recalculate friend balances
    this.friends = this.friends.map(friend => {
      // Find all expenses involving current user and this friend
      const sharedExpenses = this.expenses.filter(
        e =>
          e.participants.some(p => p.userId === this.user.id) &&
          e.participants.some(p => p.userId === friend.userId)
      );
      const sharedSettlements = this.settlements.filter(
        s =>
          (s.payerId === this.user.id && s.receiverId === friend.userId) ||
          (s.payerId === friend.userId && s.receiverId === this.user.id)
      );

      const balances = calculateBalances(sharedExpenses, sharedSettlements, friend.currency);
      const friendNet = balances[friend.userId]?.netAmount || 0;
      // If friend's net is negative in shared transactions, they owe user positive balance
      return {
        ...friend,
        netBalance: -friendNet,
      };
    });
  }

  async getCurrentUser(): Promise<User> {
    await this.ensureInitialized();
    return { ...this.user };
  }

  async updateUserProfile(data: Partial<User>): Promise<User> {
    await this.ensureInitialized();
    this.user = { ...this.user, ...data };
    await this.persistState();
    return { ...this.user };
  }

  async getGroups(): Promise<Group[]> {
    await this.ensureInitialized();
    return [...this.groups];
  }

  async getGroupById(id: string): Promise<Group | null> {
    await this.ensureInitialized();
    const found = this.groups.find(g => g.id === id);
    return found ? { ...found } : null;
  }

  async createGroup(data: Omit<Group, 'id' | 'createdAt' | 'totalSpending' | 'userBalance'>): Promise<Group> {
    await this.ensureInitialized();
    const newGroup: Group = {
      ...data,
      id: `grp_${Date.now()}`,
      createdAt: new Date().toISOString(),
      totalSpending: 0,
      userBalance: 0,
    };
    this.groups.unshift(newGroup);

    this.activities.unshift({
      id: `act_${Date.now()}`,
      type: 'group_created',
      actorId: this.user.id,
      actorName: this.user.name,
      title: `Created group "${newGroup.name}"`,
      description: `Category: ${newGroup.category}`,
      timestamp: new Date().toISOString(),
      groupId: newGroup.id,
      groupName: newGroup.name,
    });

    this.recalculateAllBalances();
    await this.persistState();
    return newGroup;
  }

  async updateGroup(id: string, data: Partial<Group>): Promise<Group> {
    await this.ensureInitialized();
    const idx = this.groups.findIndex(g => g.id === id);
    if (idx === -1) throw new Error('Group not found');
    this.groups[idx] = { ...this.groups[idx], ...data };
    this.recalculateAllBalances();
    await this.persistState();
    return { ...this.groups[idx] };
  }

  async deleteGroup(id: string): Promise<boolean> {
    await this.ensureInitialized();
    this.groups = this.groups.filter(g => g.id !== id);
    this.recalculateAllBalances();
    await this.persistState();
    return true;
  }

  async addMemberToGroup(groupId: string, member: GroupMember): Promise<Group> {
    await this.ensureInitialized();
    const grp = this.groups.find(g => g.id === groupId);
    if (!grp) throw new Error('Group not found');
    if (!grp.members.some(m => m.userId === member.userId)) {
      grp.members.push(member);
      this.activities.unshift({
        id: `act_${Date.now()}`,
        type: 'member_added',
        actorId: this.user.id,
        actorName: this.user.name,
        title: `Added ${member.name}`,
        description: `Added to ${grp.name}`,
        timestamp: new Date().toISOString(),
        groupId: grp.id,
        groupName: grp.name,
      });
      await this.persistState();
    }
    return { ...grp };
  }

  async removeMemberFromGroup(groupId: string, userId: string): Promise<Group> {
    await this.ensureInitialized();
    const grp = this.groups.find(g => g.id === groupId);
    if (!grp) throw new Error('Group not found');
    grp.members = grp.members.filter(m => m.userId !== userId);
    await this.persistState();
    return { ...grp };
  }

  async getFriends(): Promise<Friend[]> {
    await this.ensureInitialized();
    return [...this.friends];
  }

  async addFriend(data: Omit<Friend, 'id' | 'createdAt' | 'netBalance'>): Promise<Friend> {
    await this.ensureInitialized();
    const newFriend: Friend = {
      ...data,
      id: `f_${Date.now()}`,
      createdAt: new Date().toISOString(),
      netBalance: 0,
    };
    this.friends.unshift(newFriend);
    this.recalculateAllBalances();
    await this.persistState();
    return newFriend;
  }

  async removeFriend(id: string): Promise<boolean> {
    await this.ensureInitialized();
    this.friends = this.friends.filter(f => f.id !== id);
    this.recalculateAllBalances();
    await this.persistState();
    return true;
  }

  async getExpenses(groupId?: string): Promise<Expense[]> {
    await this.ensureInitialized();
    if (groupId) {
      return this.expenses.filter(e => e.groupId === groupId);
    }
    return [...this.expenses];
  }

  async getExpenseById(id: string): Promise<Expense | null> {
    await this.ensureInitialized();
    const found = this.expenses.find(e => e.id === id);
    return found ? { ...found } : null;
  }

  async createExpense(data: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    await this.ensureInitialized();
    const newExpense: Expense = {
      ...data,
      id: `exp_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.expenses.unshift(newExpense);

    this.activities.unshift({
      id: `act_${Date.now()}`,
      type: 'expense_created',
      actorId: this.user.id,
      actorName: this.user.name,
      title: `Added "${newExpense.title}"`,
      description: `Total: ${newExpense.currency} ${newExpense.totalAmount.toLocaleString()}`,
      timestamp: new Date().toISOString(),
      amount: newExpense.totalAmount,
      currency: newExpense.currency,
      groupId: newExpense.groupId || undefined,
      groupName: newExpense.groupName,
      expenseId: newExpense.id,
    });

    this.recalculateAllBalances();
    await this.persistState();
    return newExpense;
  }

  async updateExpense(id: string, data: Partial<Expense>): Promise<Expense> {
    await this.ensureInitialized();
    const idx = this.expenses.findIndex(e => e.id === id);
    if (idx === -1) throw new Error('Expense not found');
    this.expenses[idx] = {
      ...this.expenses[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.activities.unshift({
      id: `act_${Date.now()}`,
      type: 'expense_updated',
      actorId: this.user.id,
      actorName: this.user.name,
      title: `Updated "${this.expenses[idx].title}"`,
      description: `Updated expense details`,
      timestamp: new Date().toISOString(),
      groupId: this.expenses[idx].groupId || undefined,
      expenseId: id,
    });

    this.recalculateAllBalances();
    await this.persistState();
    return { ...this.expenses[idx] };
  }

  async deleteExpense(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const target = this.expenses.find(e => e.id === id);
    if (target) {
      this.activities.unshift({
        id: `act_${Date.now()}`,
        type: 'expense_deleted',
        actorId: this.user.id,
        actorName: this.user.name,
        title: `Deleted "${target.title}"`,
        description: `Expense was deleted`,
        timestamp: new Date().toISOString(),
      });
    }
    this.expenses = this.expenses.filter(e => e.id !== id);
    this.recalculateAllBalances();
    await this.persistState();
    return true;
  }

  async addCommentToExpense(expenseId: string, text: string): Promise<Expense> {
    await this.ensureInitialized();
    const idx = this.expenses.findIndex(e => e.id === expenseId);
    if (idx === -1) {
      throw new Error(`Expense ${expenseId} not found`);
    }
    const newComment: ExpenseComment = {
      id: `comment_${Date.now()}`,
      expenseId,
      userId: this.user.id,
      userName: this.user.name,
      userAvatar: this.user.avatarUrl,
      text,
      createdAt: new Date().toISOString(),
    };
    const currentComments = this.expenses[idx].comments || [];
    this.expenses[idx] = {
      ...this.expenses[idx],
      comments: [...currentComments, newComment],
      commentsCount: (this.expenses[idx].commentsCount || 0) + 1,
    };
    await this.persistState();
    return { ...this.expenses[idx] };
  }

  async getSettlements(groupId?: string): Promise<Settlement[]> {
    await this.ensureInitialized();
    if (groupId) {
      return this.settlements.filter(s => s.groupId === groupId);
    }
    return [...this.settlements];
  }

  async recordSettlement(data: Omit<Settlement, 'id' | 'createdAt'>): Promise<Settlement> {
    await this.ensureInitialized();
    const newSettlement: Settlement = {
      ...data,
      id: `set_${Date.now()}`,
      status: data.status || 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };
    this.settlements.unshift(newSettlement);

    this.activities.unshift({
      id: `act_${Date.now()}`,
      type: 'settlement_completed',
      actorId: newSettlement.payerId,
      actorName: newSettlement.payerName,
      title: 'Payment recorded',
      description: `${newSettlement.payerName} paid ${newSettlement.receiverName} ${newSettlement.currency} ${newSettlement.amount}`,
      timestamp: new Date().toISOString(),
      amount: newSettlement.amount,
      currency: newSettlement.currency,
      groupId: newSettlement.groupId || undefined,
    });

    this.recalculateAllBalances();
    await this.persistState();
    return newSettlement;
  }

  async confirmSettlement(id: string): Promise<Settlement> {
    await this.ensureInitialized();
    const target = this.settlements.find(s => s.id === id);
    if (!target) throw new Error('Settlement not found');
    target.status = 'CONFIRMED';
    target.confirmedAt = new Date().toISOString();
    this.recalculateAllBalances();
    await this.persistState();
    return { ...target };
  }

  async rejectSettlement(id: string): Promise<Settlement> {
    await this.ensureInitialized();
    const target = this.settlements.find(s => s.id === id);
    if (!target) throw new Error('Settlement not found');
    target.status = 'REJECTED';
    this.recalculateAllBalances();
    await this.persistState();
    return { ...target };
  }

  async getActivities(): Promise<Activity[]> {
    await this.ensureInitialized();
    return [...this.activities];
  }

  async getNotifications(): Promise<AppNotification[]> {
    await this.ensureInitialized();
    return [...this.notifications];
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await this.ensureInitialized();
    const n = this.notifications.find(item => item.id === id);
    if (n) {
      n.read = true;
      await this.persistState();
    }
  }

  async search(query: string): Promise<{
    groups: Group[];
    friends: Friend[];
    expenses: Expense[];
  }> {
    await this.ensureInitialized();
    const q = query.trim().toLowerCase();
    if (!q) {
      return { groups: [], friends: [], expenses: [] };
    }

    const matchedGroups = this.groups.filter(
      g => g.name.toLowerCase().includes(q) || g.category.toLowerCase().includes(q)
    );
    const matchedFriends = this.friends.filter(
      f => f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q)
    );
    const matchedExpenses = this.expenses.filter(
      e =>
        e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.notes && e.notes.toLowerCase().includes(q))
    );

    return {
      groups: matchedGroups,
      friends: matchedFriends,
      expenses: matchedExpenses,
    };
  }
}

export class HybridSplitMateRepository implements ISplitMateRepository {
  private localRepo = new LocalPersistentRepository();
  private httpRepo = new HttpRepository();

  private async executeWithFallback<T>(
    operation: (repo: ISplitMateRepository) => Promise<T>,
    opName: string
  ): Promise<T> {
    if (config.useMockApi) {
      return operation(this.localRepo);
    }
    try {
      return await operation(this.httpRepo);
    } catch (error: any) {
      // If network is offline or local dev backend server is not running yet
      if (
        error?.code === 'NETWORK_ERROR' ||
        error?.message?.includes('Network error') ||
        error?.message?.includes('Network Error')
      ) {
        console.warn(
          `[SplitMate] Backend server unreachable at ${config.apiBaseUrl} during ${opName}. Auto-fallback to local offline repository.`
        );
        return operation(this.localRepo);
      }
      throw error;
    }
  }

  getCurrentUser(): Promise<User> {
    return this.executeWithFallback(r => r.getCurrentUser(), 'getCurrentUser');
  }

  updateUserProfile(data: Partial<User>): Promise<User> {
    return this.executeWithFallback(r => r.updateUserProfile(data), 'updateUserProfile');
  }

  getGroups(): Promise<Group[]> {
    return this.executeWithFallback(r => r.getGroups(), 'getGroups');
  }

  getGroupById(id: string): Promise<Group | null> {
    return this.executeWithFallback(r => r.getGroupById(id), 'getGroupById');
  }

  createGroup(data: Omit<Group, 'id' | 'createdAt' | 'totalSpending' | 'userBalance'>): Promise<Group> {
    return this.executeWithFallback(r => r.createGroup(data), 'createGroup');
  }

  updateGroup(id: string, data: Partial<Group>): Promise<Group> {
    return this.executeWithFallback(r => r.updateGroup(id, data), 'updateGroup');
  }

  deleteGroup(id: string): Promise<boolean> {
    return this.executeWithFallback(r => r.deleteGroup(id), 'deleteGroup');
  }

  addMemberToGroup(groupId: string, member: GroupMember): Promise<Group> {
    return this.executeWithFallback(r => r.addMemberToGroup(groupId, member), 'addMemberToGroup');
  }

  removeMemberFromGroup(groupId: string, userId: string): Promise<Group> {
    return this.executeWithFallback(r => r.removeMemberFromGroup(groupId, userId), 'removeMemberFromGroup');
  }

  getFriends(): Promise<Friend[]> {
    return this.executeWithFallback(r => r.getFriends(), 'getFriends');
  }

  addFriend(data: Omit<Friend, 'id' | 'createdAt' | 'netBalance'>): Promise<Friend> {
    return this.executeWithFallback(r => r.addFriend(data), 'addFriend');
  }

  removeFriend(id: string): Promise<boolean> {
    return this.executeWithFallback(r => r.removeFriend(id), 'removeFriend');
  }

  getExpenses(groupId?: string): Promise<Expense[]> {
    return this.executeWithFallback(r => r.getExpenses(groupId), 'getExpenses');
  }

  getExpenseById(id: string): Promise<Expense | null> {
    return this.executeWithFallback(r => r.getExpenseById(id), 'getExpenseById');
  }

  createExpense(data: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    return this.executeWithFallback(r => r.createExpense(data), 'createExpense');
  }

  updateExpense(id: string, data: Partial<Expense>): Promise<Expense> {
    return this.executeWithFallback(r => r.updateExpense(id, data), 'updateExpense');
  }

  deleteExpense(id: string): Promise<boolean> {
    return this.executeWithFallback(r => r.deleteExpense(id), 'deleteExpense');
  }

  addCommentToExpense(expenseId: string, text: string): Promise<Expense> {
    return this.executeWithFallback(r => r.addCommentToExpense(expenseId, text), 'addCommentToExpense');
  }

  getSettlements(groupId?: string): Promise<Settlement[]> {
    return this.executeWithFallback(r => r.getSettlements(groupId), 'getSettlements');
  }

  recordSettlement(data: Omit<Settlement, 'id' | 'createdAt'>): Promise<Settlement> {
    return this.executeWithFallback(r => r.recordSettlement(data), 'recordSettlement');
  }

  confirmSettlement(id: string): Promise<Settlement> {
    return this.executeWithFallback(r => r.confirmSettlement(id), 'confirmSettlement');
  }

  rejectSettlement(id: string): Promise<Settlement> {
    return this.executeWithFallback(r => r.rejectSettlement(id), 'rejectSettlement');
  }

  getActivities(): Promise<Activity[]> {
    return this.executeWithFallback(r => r.getActivities(), 'getActivities');
  }

  getNotifications(): Promise<AppNotification[]> {
    return this.executeWithFallback(r => r.getNotifications(), 'getNotifications');
  }

  markNotificationAsRead(id: string): Promise<void> {
    return this.executeWithFallback(r => r.markNotificationAsRead(id), 'markNotificationAsRead');
  }

  search(query: string): Promise<{
    groups: Group[];
    friends: Friend[];
    expenses: Expense[];
  }> {
    return this.executeWithFallback(r => r.search(query), 'search');
  }
}

export const repository: ISplitMateRepository = new HybridSplitMateRepository();
