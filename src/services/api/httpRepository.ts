import { apiClient } from './client';
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
import { ISplitMateRepository } from './repository';

const extractData = <T>(response: any): T => {
  if (response?.data && response.data.data !== undefined) {
    return response.data.data as T;
  }
  return response.data as T;
};

export class HttpRepository implements ISplitMateRepository {
  // User Profile
  async getCurrentUser(): Promise<User> {
    const res = await apiClient.get('/users/me');
    return extractData<User>(res);
  }

  async updateUserProfile(data: Partial<User>): Promise<User> {
    const res = await apiClient.patch('/users/me', data);
    return extractData<User>(res);
  }

  // Groups
  async getGroups(): Promise<Group[]> {
    const res = await apiClient.get('/groups');
    return extractData<Group[]>(res);
  }

  async getGroupById(id: string): Promise<Group | null> {
    try {
      const res = await apiClient.get(`/groups/${id}`);
      return extractData<Group>(res);
    } catch (e: any) {
      if (e.statusCode === 404) return null;
      throw e;
    }
  }

  async createGroup(data: Omit<Group, 'id' | 'createdAt' | 'totalSpending' | 'userBalance'>): Promise<Group> {
    const res = await apiClient.post('/groups', data);
    return extractData<Group>(res);
  }

  async updateGroup(id: string, data: Partial<Group>): Promise<Group> {
    const res = await apiClient.patch(`/groups/${id}`, data);
    return extractData<Group>(res);
  }

  async deleteGroup(id: string): Promise<boolean> {
    await apiClient.delete(`/groups/${id}`);
    return true;
  }

  async addMemberToGroup(groupId: string, member: GroupMember): Promise<Group> {
    const res = await apiClient.post(`/groups/${groupId}/members`, member);
    return extractData<Group>(res);
  }

  async removeMemberFromGroup(groupId: string, userId: string): Promise<Group> {
    const res = await apiClient.delete(`/groups/${groupId}/members/${userId}`);
    return extractData<Group>(res);
  }

  // Friends
  async getFriends(): Promise<Friend[]> {
    const res = await apiClient.get('/friends');
    return extractData<Friend[]>(res);
  }

  async addFriend(data: Omit<Friend, 'id' | 'createdAt' | 'netBalance'>): Promise<Friend> {
    const res = await apiClient.post('/friends', data);
    return extractData<Friend>(res);
  }

  async removeFriend(id: string): Promise<boolean> {
    await apiClient.delete(`/friends/${id}`);
    return true;
  }

  // Expenses
  async getExpenses(groupId?: string): Promise<Expense[]> {
    const res = await apiClient.get('/expenses', {
      params: groupId ? { groupId } : undefined,
    });
    return extractData<Expense[]>(res);
  }

  async getExpenseById(id: string): Promise<Expense | null> {
    try {
      const res = await apiClient.get(`/expenses/${id}`);
      return extractData<Expense>(res);
    } catch (e: any) {
      if (e.statusCode === 404) return null;
      throw e;
    }
  }

  async createExpense(data: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    const res = await apiClient.post('/expenses', data);
    return extractData<Expense>(res);
  }

  async updateExpense(id: string, data: Partial<Expense>): Promise<Expense> {
    const res = await apiClient.patch(`/expenses/${id}`, data);
    return extractData<Expense>(res);
  }

  async deleteExpense(id: string): Promise<boolean> {
    await apiClient.delete(`/expenses/${id}`);
    return true;
  }

  async addCommentToExpense(expenseId: string, text: string): Promise<Expense> {
    const res = await apiClient.post(`/expenses/${expenseId}/comments`, { text });
    return extractData<Expense>(res);
  }

  // Settlements
  async getSettlements(groupId?: string): Promise<Settlement[]> {
    const res = await apiClient.get('/settlements', {
      params: groupId ? { groupId } : undefined,
    });
    return extractData<Settlement[]>(res);
  }

  async recordSettlement(data: Omit<Settlement, 'id' | 'createdAt'>): Promise<Settlement> {
    const res = await apiClient.post('/settlements', data);
    return extractData<Settlement>(res);
  }

  async confirmSettlement(id: string): Promise<Settlement> {
    const res = await apiClient.post(`/settlements/${id}/confirm`);
    return extractData<Settlement>(res);
  }

  async rejectSettlement(id: string): Promise<Settlement> {
    const res = await apiClient.post(`/settlements/${id}/reject`);
    return extractData<Settlement>(res);
  }

  // Activities
  async getActivities(): Promise<Activity[]> {
    const res = await apiClient.get('/activities');
    return extractData<Activity[]>(res);
  }

  // Notifications
  async getNotifications(): Promise<AppNotification[]> {
    const res = await apiClient.get('/notifications');
    return extractData<AppNotification[]>(res);
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  }

  // Search
  async search(query: string): Promise<{
    groups: Group[];
    friends: Friend[];
    expenses: Expense[];
  }> {
    const res = await apiClient.get('/search', { params: { q: query } });
    return extractData<{
      groups: Group[];
      friends: Friend[];
      expenses: Expense[];
    }>(res);
  }
}
