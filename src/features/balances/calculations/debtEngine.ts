import { CurrencyCode, Expense, Settlement, SimplifiedDebt } from '../../../types';
import { toMinorUnits, fromMinorUnits } from '../../../utils/money';

export interface ParticipantNetBalance {
  userId: string;
  userName: string;
  netMinor: number; // positive = owed money (+), negative = owes money (-)
  netAmount: number;
}

/**
 * Calculates net balances for all participants across a list of expenses and settlements.
 */
export function calculateBalances(
  expenses: Expense[],
  settlements: Settlement[] = [],
  currency: CurrencyCode = 'INR'
): Record<string, ParticipantNetBalance> {
  const balances: Record<string, { userName: string; netMinor: number }> = {};

  const ensureUser = (userId: string, userName: string) => {
    if (!balances[userId]) {
      balances[userId] = { userName, netMinor: 0 };
    }
  };

  // Process Expenses
  for (const exp of expenses) {
    for (const p of exp.participants) {
      ensureUser(p.userId, p.name);
      const paidMinor = toMinorUnits(p.paidAmount, currency);
      const shareMinor = toMinorUnits(p.shareAmount, currency);
      // Net change for this user = paid - share
      balances[p.userId].netMinor += paidMinor - shareMinor;
    }
  }

  // Process Settlements (payer paid receiver)
  // Only CONFIRMED settlements clear debts (REJECTED are ignored)
  for (const s of settlements) {
    if (s.status === 'REJECTED') continue;
    ensureUser(s.payerId, s.payerName);
    ensureUser(s.receiverId, s.receiverName);
    const amountMinor = toMinorUnits(s.amount, currency);
    balances[s.payerId].netMinor += amountMinor;
    balances[s.receiverId].netMinor -= amountMinor;
  }

  const result: Record<string, ParticipantNetBalance> = {};
  for (const [userId, val] of Object.entries(balances)) {
    result[userId] = {
      userId,
      userName: val.userName,
      netMinor: val.netMinor,
      netAmount: fromMinorUnits(val.netMinor, currency),
    };
  }

  return result;
}

/**
 * Calculates the balance summary specifically for a given user:
 * - totalBalance: net balance (positive = owed, negative = owes)
 * - youOwe: total amount user owes
 * - youAreOwed: total amount others owe to user
 */
export function calculateUserBalance(
  userId: string,
  expenses: Expense[],
  settlements: Settlement[] = [],
  currency: CurrencyCode = 'INR'
): { totalBalance: number; youOwe: number; youAreOwed: number } {
  const balances = calculateBalances(expenses, settlements, currency);
  const userNet = balances[userId]?.netAmount || 0;

  // Compute bilateral breakdown with debt simplification for accuracy
  const simplified = simplifyDebts(expenses, settlements, currency);
  let youOwe = 0;
  let youAreOwed = 0;

  for (const debt of simplified) {
    if (debt.fromUserId === userId) {
      youOwe += debt.amount;
    } else if (debt.toUserId === userId) {
      youAreOwed += debt.amount;
    }
  }

  return {
    totalBalance: userNet,
    youOwe: Math.round(youOwe * 100) / 100,
    youAreOwed: Math.round(youAreOwed * 100) / 100,
  };
}

/**
 * Smart Debt Simplification Algorithm.
 * Minimizes transaction count while strictly preserving exact balances.
 * Zero-sum conservation: sum of positive balances must equal sum of negative balances.
 */
export function simplifyDebts(
  expenses: Expense[],
  settlements: Settlement[] = [],
  currency: CurrencyCode = 'INR'
): SimplifiedDebt[] {
  const netBalances = calculateBalances(expenses, settlements, currency);

  interface DebtorCreditor {
    userId: string;
    userName: string;
    amountMinor: number;
  }

  const debtors: DebtorCreditor[] = []; // Owe money (netMinor < 0)
  const creditors: DebtorCreditor[] = []; // Owed money (netMinor > 0)

  for (const b of Object.values(netBalances)) {
    if (b.netMinor < 0) {
      debtors.push({
        userId: b.userId,
        userName: b.userName,
        amountMinor: -b.netMinor, // Positive debt amount
      });
    } else if (b.netMinor > 0) {
      creditors.push({
        userId: b.userId,
        userName: b.userName,
        amountMinor: b.netMinor,
      });
    }
  }

  // Sort largest to smallest for greedy minimization
  debtors.sort((a, b) => b.amountMinor - a.amountMinor);
  creditors.sort((a, b) => b.amountMinor - a.amountMinor);

  const simplified: SimplifiedDebt[] = [];

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settleMinor = Math.min(debtor.amountMinor, creditor.amountMinor);

    if (settleMinor > 0) {
      simplified.push({
        fromUserId: debtor.userId,
        fromUserName: debtor.userName,
        toUserId: creditor.userId,
        toUserName: creditor.userName,
        amount: fromMinorUnits(settleMinor, currency),
        currency,
      });
    }

    debtor.amountMinor -= settleMinor;
    creditor.amountMinor -= settleMinor;

    if (debtor.amountMinor === 0) {
      dIdx++;
    }
    if (creditor.amountMinor === 0) {
      cIdx++;
    }
  }

  return simplified;
}

/**
 * Calculates a settlement payment and returns remaining debt
 */
export function calculateSettlement(
  currentDebtAmount: number,
  paymentAmount: number,
  currency: CurrencyCode = 'INR'
): { remainingDebt: number; isFullySettled: boolean } {
  const debtMinor = toMinorUnits(currentDebtAmount, currency);
  const payMinor = toMinorUnits(paymentAmount, currency);
  const remainingMinor = Math.max(0, debtMinor - payMinor);

  return {
    remainingDebt: fromMinorUnits(remainingMinor, currency),
    isFullySettled: remainingMinor === 0,
  };
}

