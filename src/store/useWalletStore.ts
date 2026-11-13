import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BankDetails {
  accountNumber: string;
  confirmAccountNumber?: string;
  ifsc: string;
  accountHolder: string;
  bankName?: string;
  upiId?: string;
}

export type WalletTxType = 'deposit' | 'withdrawal' | 'settlement_payment' | 'settlement_received';

export interface WalletTransaction {
  id: string;
  type: WalletTxType;
  amount: number;
  currency: string;
  title: string;
  subtitle: string;
  date: string;
  status: 'completed' | 'processing' | 'failed';
  referenceId: string;
  paymentMethod?: string;
  bankDetails?: BankDetails;
}

interface WalletState {
  balance: number;
  currency: string;
  transactions: WalletTransaction[];
  isLoading: boolean;

  // Actions
  loadWallet: () => Promise<void>;
  addFunds: (amount: number, method?: string) => Promise<{ success: boolean; message: string; transaction: WalletTransaction }>;
  withdrawToBank: (amount: number, bankDetails: BankDetails) => Promise<{ success: boolean; message: string; transaction?: WalletTransaction }>;
  payFromWallet: (amount: number, recipientName: string, settlementId?: string) => Promise<{ success: boolean; message: string; transaction?: WalletTransaction }>;
  receiveIntoWallet: (amount: number, senderName: string, settlementId?: string) => Promise<void>;
  resetWallet: () => Promise<void>;
}

const STORAGE_KEY = '@splitmate_wallet_state';
const INITIAL_BALANCE = 5000; // Starting bonus balance: ₹5,000.00

const INITIAL_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'tx_init_1',
    type: 'deposit',
    amount: 5000,
    currency: 'INR',
    title: 'Welcome Wallet Credit',
    subtitle: 'SplitMate Initial Balance for bill splits & transfers',
    date: new Date().toISOString(),
    status: 'completed',
    referenceId: 'SPLIT-INIT-5000',
    paymentMethod: 'SplitMate Bonus',
  },
];

export const useWalletStore = create<WalletState>((set, get) => ({
  balance: INITIAL_BALANCE,
  currency: 'INR',
  transactions: INITIAL_TRANSACTIONS,
  isLoading: false,

  loadWallet: async () => {
    try {
      set({ isLoading: true });
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          balance: typeof parsed.balance === 'number' ? parsed.balance : INITIAL_BALANCE,
          currency: parsed.currency || 'INR',
          transactions: Array.isArray(parsed.transactions) ? parsed.transactions : INITIAL_TRANSACTIONS,
          isLoading: false,
        });
        return;
      }
      // Save initial defaults if not already stored
      const initial = {
        balance: INITIAL_BALANCE,
        currency: 'INR',
        transactions: INITIAL_TRANSACTIONS,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      set({ balance: INITIAL_BALANCE, currency: 'INR', transactions: INITIAL_TRANSACTIONS, isLoading: false });
    } catch (e) {
      console.warn('Failed to load wallet state from storage', e);
      set({ isLoading: false });
    }
  },

  addFunds: async (amount: number, method: string = 'UPI (GPay / PhonePe)') => {
    if (amount <= 0) {
      throw new Error('Please enter a valid amount to add.');
    }

    const currentBalance = get().balance;
    const newBalance = currentBalance + amount;
    const txId = `tx_topup_${Date.now()}`;
    const refId = `UTR-${Date.now().toString().slice(-8)}`;

    const newTx: WalletTransaction = {
      id: txId,
      type: 'deposit',
      amount,
      currency: 'INR',
      title: 'Added Money to Wallet',
      subtitle: `Loaded via ${method}`,
      date: new Date().toISOString(),
      status: 'completed',
      referenceId: refId,
      paymentMethod: method,
    };

    const nextTransactions = [newTx, ...get().transactions];

    set({
      balance: newBalance,
      transactions: nextTransactions,
    });

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          balance: newBalance,
          currency: get().currency,
          transactions: nextTransactions,
        })
      );
    } catch (e) {
      console.warn('Failed to persist wallet deposit', e);
    }

    return {
      success: true,
      message: `₹${amount.toLocaleString('en-IN')} successfully added to your SplitMate Wallet!`,
      transaction: newTx,
    };
  },

  withdrawToBank: async (amount: number, bankDetails: BankDetails) => {
    const currentBalance = get().balance;
    if (amount <= 0) {
      return { success: false, message: 'Please enter a valid withdrawal amount.' };
    }
    if (amount < 10) {
      return { success: false, message: 'Minimum bank transfer amount is ₹10.' };
    }
    if (amount > currentBalance) {
      return {
        success: false,
        message: `Insufficient wallet balance. You have ₹${currentBalance.toLocaleString('en-IN')} available.`,
      };
    }

    const newBalance = currentBalance - amount;
    const txId = `tx_with_${Date.now()}`;
    const refId = `NEFT-${Date.now().toString().slice(-8)}`;

    const destLabel = bankDetails.accountNumber
      ? `A/C ••••${bankDetails.accountNumber.slice(-4)} (${bankDetails.ifsc.toUpperCase()})`
      : bankDetails.upiId || 'Bank Account';

    const newTx: WalletTransaction = {
      id: txId,
      type: 'withdrawal',
      amount,
      currency: 'INR',
      title: 'Transferred to Bank Account',
      subtitle: `Sent to ${bankDetails.accountHolder} • ${destLabel}`,
      date: new Date().toISOString(),
      status: 'completed',
      referenceId: refId,
      paymentMethod: 'Bank Transfer (IMPS/NEFT)',
      bankDetails,
    };

    const nextTransactions = [newTx, ...get().transactions];

    set({
      balance: newBalance,
      transactions: nextTransactions,
    });

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          balance: newBalance,
          currency: get().currency,
          transactions: nextTransactions,
        })
      );
    } catch (e) {
      console.warn('Failed to persist wallet withdrawal', e);
    }

    return {
      success: true,
      message: `₹${amount.toLocaleString('en-IN')} transferred to your bank account successfully! Reference ID: ${refId}`,
      transaction: newTx,
    };
  },

  payFromWallet: async (amount: number, recipientName: string, settlementId?: string) => {
    const currentBalance = get().balance;
    if (amount <= 0) {
      return { success: false, message: 'Please enter a valid payment amount.' };
    }
    if (amount > currentBalance) {
      return {
        success: false,
        message: `Insufficient wallet balance. You need ₹${amount.toLocaleString('en-IN')} but have ₹${currentBalance.toLocaleString('en-IN')}. Please add funds.`,
      };
    }

    const newBalance = currentBalance - amount;
    const txId = `tx_pay_${Date.now()}`;
    const refId = settlementId || `WLT-SETTLE-${Date.now().toString().slice(-6)}`;

    const newTx: WalletTransaction = {
      id: txId,
      type: 'settlement_payment',
      amount,
      currency: 'INR',
      title: `Settled with ${recipientName}`,
      subtitle: 'Paid directly from SplitMate Wallet balance',
      date: new Date().toISOString(),
      status: 'completed',
      referenceId: refId,
      paymentMethod: 'SplitMate Wallet',
    };

    const nextTransactions = [newTx, ...get().transactions];

    set({
      balance: newBalance,
      transactions: nextTransactions,
    });

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          balance: newBalance,
          currency: get().currency,
          transactions: nextTransactions,
        })
      );
    } catch (e) {
      console.warn('Failed to persist wallet payment', e);
    }

    return {
      success: true,
      message: `₹${amount.toLocaleString('en-IN')} paid to ${recipientName} from your SplitMate Wallet!`,
      transaction: newTx,
    };
  },

  receiveIntoWallet: async (amount: number, senderName: string, settlementId?: string) => {
    const newBalance = get().balance + amount;
    const txId = `tx_recv_${Date.now()}`;
    const refId = settlementId || `WLT-RCV-${Date.now().toString().slice(-6)}`;

    const newTx: WalletTransaction = {
      id: txId,
      type: 'settlement_received',
      amount,
      currency: 'INR',
      title: `Payment from ${senderName}`,
      subtitle: 'Credited directly to your SplitMate Wallet',
      date: new Date().toISOString(),
      status: 'completed',
      referenceId: refId,
      paymentMethod: 'SplitMate Wallet',
    };

    const nextTransactions = [newTx, ...get().transactions];

    set({
      balance: newBalance,
      transactions: nextTransactions,
    });

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          balance: newBalance,
          currency: get().currency,
          transactions: nextTransactions,
        })
      );
    } catch (e) {
      console.warn('Failed to persist wallet receive', e);
    }
  },

  resetWallet: async () => {
    set({
      balance: INITIAL_BALANCE,
      transactions: INITIAL_TRANSACTIONS,
    });
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          balance: INITIAL_BALANCE,
          currency: 'INR',
          transactions: INITIAL_TRANSACTIONS,
        })
      );
    } catch {}
  },
}));

// Auto-initialize wallet on import
useWalletStore.getState().loadWallet();

