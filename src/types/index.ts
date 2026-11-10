export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD' | 'SGD' | 'AED' | 'JPY';

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  name: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, Currency> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 2 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimals: 2 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimals: 2 },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', decimals: 2 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0 },
};

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  upiId?: string;
  avatarUrl?: string;
  defaultCurrency: CurrencyCode;
  createdAt: string;
}

export interface Friend {
  id: string;
  userId: string;
  name: string;
  email: string;
  phoneNumber?: string;
  upiId?: string;
  avatarUrl?: string;
  netBalance: number; // In base units (e.g. 500.00). Positive means they owe current user, negative means current user owes them
  currency: CurrencyCode;
  createdAt: string;
}

export type GroupCategory = 'Trip' | 'Home' | 'Couple' | 'Family' | 'Friends' | 'Office' | 'Other';

export interface GroupMember {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  category: GroupCategory;
  currency: CurrencyCode;
  avatarUrl?: string;
  createdBy: string;
  createdAt: string;
  members: GroupMember[];
  totalSpending: number;
  userBalance: number; // Positive = user is owed, Negative = user owes
  isArchived?: boolean;
}

export type ExpenseCategory =
  | 'Food'
  | 'Groceries'
  | 'Transport'
  | 'Rent'
  | 'Utilities'
  | 'Shopping'
  | 'Entertainment'
  | 'Travel'
  | 'Medical'
  | 'Other';

export type SplitMethod = 'equally' | 'unequally' | 'percentage' | 'shares' | 'exact';

export interface ExpenseParticipant {
  userId: string;
  name: string;
  avatarUrl?: string;
  paidAmount: number; // How much this person paid up-front
  shareAmount: number; // How much this person is responsible for
  netBalance: number; // paidAmount - shareAmount
  // Split configuration inputs
  percentage?: number;
  shares?: number;
  exactAmount?: number;
}

export interface ExpenseComment {
  id: string;
  expenseId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  totalAmount: number;
  currency: CurrencyCode;
  date: string;
  category: ExpenseCategory;
  groupId?: string | null;
  groupName?: string;
  notes?: string;
  receiptUri?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  splitMethod: SplitMethod;
  participants: ExpenseParticipant[];
  commentsCount?: number;
  comments?: ExpenseComment[];
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Bank transfer' | 'Other';
export type SettlementStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

export interface Settlement {
  id: string;
  groupId?: string | null;
  groupName?: string;
  payerId: string;
  payerName: string;
  receiverId: string;
  receiverName: string;
  amount: number;
  currency: CurrencyCode;
  paymentMethod: PaymentMethod;
  status: SettlementStatus;
  upiId?: string;
  transactionReference?: string;
  notes?: string;
  date: string;
  createdAt: string;
  confirmedAt?: string;
}

export interface SimplifiedDebt {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  currency: CurrencyCode;
}

export interface BalanceSummary {
  totalBalance: number; // Net balance
  youOwe: number; // Absolute positive amount you owe to others
  youAreOwed: number; // Absolute positive amount others owe to you
  currency: CurrencyCode;
}

export type ActivityType =
  | 'expense_created'
  | 'expense_updated'
  | 'expense_deleted'
  | 'member_added'
  | 'group_created'
  | 'payment_recorded'
  | 'settlement_completed';

export interface Activity {
  id: string;
  type: ActivityType;
  actorId: string;
  actorName: string;
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  currency?: CurrencyCode;
  groupId?: string;
  groupName?: string;
  expenseId?: string;
  metadata?: Record<string, any>;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'expense' | 'settlement' | 'invite' | 'reminder';
  deepLink?: string;
}

