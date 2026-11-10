import { create } from 'zustand';
import {
  Group,
  Friend,
  Expense,
  Settlement,
  Activity,
  AppNotification,
  BalanceSummary,
  SimplifiedDebt,
} from '../types';
import { repository } from '../services/api/repository';
import { calculateUserBalance, simplifyDebts } from '../features/balances/calculations/debtEngine';
import { useAuthStore } from './useAuthStore';

interface AppState {
  groups: Group[];
  friends: Friend[];
  expenses: Expense[];
  settlements: Settlement[];
  activities: Activity[];
  notifications: AppNotification[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;

  // Computed state
  balanceSummary: BalanceSummary;
  simplifiedDebts: SimplifiedDebt[];

  // Actions
  loadInitialData: () => Promise<void>;
  refreshAll: () => Promise<void>;

  // Group actions
  createGroup: (data: Parameters<typeof repository.createGroup>[0]) => Promise<Group>;
  updateGroup: (id: string, data: Partial<Group>) => Promise<Group>;
  deleteGroup: (id: string) => Promise<boolean>;

  // Friend actions
  addFriend: (data: Parameters<typeof repository.addFriend>[0]) => Promise<Friend>;
  removeFriend: (id: string) => Promise<boolean>;

  // Expense actions
  createExpense: (data: Parameters<typeof repository.createExpense>[0]) => Promise<Expense>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<boolean>;

  // Settlement actions
  recordSettlement: (data: Parameters<typeof repository.recordSettlement>[0]) => Promise<Settlement>;
  confirmSettlement: (id: string) => Promise<Settlement>;
  rejectSettlement: (id: string) => Promise<Settlement>;

  // Notifications
  markNotificationRead: (id: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  groups: [],
  friends: [],
  expenses: [],
  settlements: [],
  activities: [],
  notifications: [],
  isLoading: true,
  isSyncing: false,
  error: null,
  balanceSummary: {
    totalBalance: 0,
    youOwe: 0,
    youAreOwed: 0,
    currency: 'INR',
  },
  simplifiedDebts: [],

  loadInitialData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [groups, friends, expenses, settlements, activities, notifications] = await Promise.all([
        repository.getGroups(),
        repository.getFriends(),
        repository.getExpenses(),
        repository.getSettlements(),
        repository.getActivities(),
        repository.getNotifications(),
      ]);

      const currentUserId = useAuthStore.getState().currentUser?.id || 'usr_me';
      const balance = calculateUserBalance(currentUserId, expenses, settlements, 'INR');
      const simplified = simplifyDebts(expenses, settlements, 'INR');

      set({
        groups,
        friends,
        expenses,
        settlements,
        activities,
        notifications,
        balanceSummary: {
          ...balance,
          currency: 'INR',
        },
        simplifiedDebts: simplified,
        isLoading: false,
      });
    } catch (e: any) {
      set({ error: e.message || 'Failed to load data', isLoading: false });
    }
  },

  refreshAll: async () => {
    set({ isSyncing: true });
    try {
      const [groups, friends, expenses, settlements, activities, notifications] = await Promise.all([
        repository.getGroups(),
        repository.getFriends(),
        repository.getExpenses(),
        repository.getSettlements(),
        repository.getActivities(),
        repository.getNotifications(),
      ]);

      const currentUserId = useAuthStore.getState().currentUser?.id || 'usr_me';
      const balance = calculateUserBalance(currentUserId, expenses, settlements, 'INR');
      const simplified = simplifyDebts(expenses, settlements, 'INR');

      set({
        groups,
        friends,
        expenses,
        settlements,
        activities,
        notifications,
        balanceSummary: {
          ...balance,
          currency: 'INR',
        },
        simplifiedDebts: simplified,
        isSyncing: false,
      });
    } catch {
      set({ isSyncing: false });
    }
  },

  createGroup: async data => {
    const created = await repository.createGroup(data);
    await get().refreshAll();
    return created;
  },

  updateGroup: async (id, data) => {
    const updated = await repository.updateGroup(id, data);
    await get().refreshAll();
    return updated;
  },

  deleteGroup: async id => {
    const res = await repository.deleteGroup(id);
    await get().refreshAll();
    return res;
  },

  addFriend: async data => {
    const created = await repository.addFriend(data);
    await get().refreshAll();
    return created;
  },

  removeFriend: async id => {
    const res = await repository.removeFriend(id);
    await get().refreshAll();
    return res;
  },

  createExpense: async data => {
    const created = await repository.createExpense(data);
    await get().refreshAll();
    return created;
  },

  updateExpense: async (id, data) => {
    const updated = await repository.updateExpense(id, data);
    await get().refreshAll();
    return updated;
  },

  deleteExpense: async id => {
    const res = await repository.deleteExpense(id);
    await get().refreshAll();
    return res;
  },

  recordSettlement: async data => {
    const created = await repository.recordSettlement(data);
    await get().refreshAll();
    return created;
  },

  confirmSettlement: async id => {
    const updated = await repository.confirmSettlement(id);
    await get().refreshAll();
    return updated;
  },

  rejectSettlement: async id => {
    const updated = await repository.rejectSettlement(id);
    await get().refreshAll();
    return updated;
  },

  markNotificationRead: async id => {
    await repository.markNotificationAsRead(id);
    set(state => ({
      notifications: state.notifications.map(n => (n.id === id ? { ...n, read: true } : n)),
    }));
  },
}));

