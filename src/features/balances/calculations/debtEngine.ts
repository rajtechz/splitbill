import { CurrencyCode, Expense, Settlement, SimplifiedDebt, Friend, Group } from '../../../types';
import { toMinorUnits, fromMinorUnits } from '../../../utils/money';
import { isUserMatch, UserLike } from '../../../utils/userMatch';

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
  currency: CurrencyCode = 'INR',
  currentUser?: UserLike | null
): Record<string, ParticipantNetBalance> {
  const balances: Record<string, { userName: string; netMinor: number }> = {};

  const resolveUserId = (p: { userId: string; name: string; email?: string }): string => {
    if (currentUser && isUserMatch(p, currentUser)) {
      return currentUser.id || currentUser.userId || p.userId;
    }
    return p.userId;
  };

  const ensureUser = (userId: string, userName: string) => {
    if (!balances[userId]) {
      balances[userId] = { userName, netMinor: 0 };
    }
  };

  // Process Expenses
  for (const exp of expenses) {
    for (const p of exp.participants) {
      const uId = resolveUserId(p);
      ensureUser(uId, p.name);
      const paidMinor = toMinorUnits(p.paidAmount, currency);
      const shareMinor = toMinorUnits(p.shareAmount, currency);
      // Net change for this user = paid - share
      balances[uId].netMinor += paidMinor - shareMinor;
    }
  }

  // Process Settlements (payer paid receiver)
  // Only CONFIRMED settlements clear debts (REJECTED are ignored)
  for (const s of settlements) {
    if (s.status === 'REJECTED') continue;
    const payerId = resolveUserId({ userId: s.payerId, name: s.payerName });
    const receiverId = resolveUserId({ userId: s.receiverId, name: s.receiverName });
    ensureUser(payerId, s.payerName);
    ensureUser(receiverId, s.receiverName);
    const amountMinor = toMinorUnits(s.amount, currency);
    balances[payerId].netMinor += amountMinor;
    balances[receiverId].netMinor -= amountMinor;
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
  currency: CurrencyCode = 'INR',
  currentUser?: UserLike | null
): { totalBalance: number; youOwe: number; youAreOwed: number } {
  const resolvedUser = currentUser || { id: userId };
  const targetId = resolvedUser.id || resolvedUser.userId || userId;
  const balances = calculateBalances(expenses, settlements, currency, resolvedUser);
  const userNet = balances[targetId]?.netAmount || 0;

  // Compute bilateral breakdown with debt simplification for accuracy
  const simplified = simplifyDebts(expenses, settlements, currency, resolvedUser);
  let youOwe = 0;
  let youAreOwed = 0;

  for (const debt of simplified) {
    if (debt.fromUserId === targetId) {
      youOwe += debt.amount;
    } else if (debt.toUserId === targetId) {
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
  currency: CurrencyCode = 'INR',
  currentUser?: UserLike | null
): SimplifiedDebt[] {
  const netBalances = calculateBalances(expenses, settlements, currency, currentUser);

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

export interface PersonDebtDetail {
  userId: string;
  name: string;
  amount: number;
  currency: CurrencyCode;
  avatarUrl?: string;
  email?: string;
  phoneNumber?: string;
  upiId: string;
  groupName?: string;
  isFriend?: boolean;
  friendId?: string;
}

export function getPeopleDebts(
  expenses: Expense[],
  settlements: Settlement[] = [],
  friends: Friend[] = [],
  groups: Group[] = [],
  currency: CurrencyCode = 'INR',
  currentUser?: UserLike | null
): {
  peopleYouOwe: PersonDebtDetail[];
  peopleWhoOweYou: PersonDebtDetail[];
} {
  const simplified = simplifyDebts(expenses, settlements, currency, currentUser);

  const enrichProfile = (
    targetUserId: string,
    targetName: string
  ): {
    avatarUrl?: string;
    email?: string;
    phoneNumber?: string;
    upiId: string;
    groupName?: string;
    isFriend: boolean;
    friendId?: string;
  } => {
    let avatarUrl: string | undefined;
    let email: string | undefined;
    let phoneNumber: string | undefined;
    let upiId: string | undefined;
    let groupName: string | undefined;
    let isFriend = false;
    let friendId: string | undefined;

    // 1. Check friends
    const f = friends.find(item => isUserMatch({ userId: targetUserId, name: targetName }, item));
    if (f) {
      avatarUrl = f.avatarUrl;
      email = f.email;
      phoneNumber = f.phoneNumber;
      upiId = f.upiId;
      isFriend = true;
      friendId = f.id;
    }

    // 2. Check groups
    for (const g of groups) {
      const m = g.members.find(mem => isUserMatch({ userId: targetUserId, name: targetName }, mem));
      if (m) {
        avatarUrl = avatarUrl || m.avatarUrl;
        email = email || m.email;
        groupName = groupName || g.name;
      }
    }

    // 3. Check expenses
    for (const exp of expenses) {
      const p = exp.participants.find(part => isUserMatch({ userId: targetUserId, name: targetName }, part));
      if (p) {
        avatarUrl = avatarUrl || p.avatarUrl;
        if (exp.groupName) groupName = groupName || exp.groupName;
      }
    }

    // Generate standard fallback UPI ID if not present
    if (!upiId) {
      if (phoneNumber) {
        const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
        upiId = `${cleanPhone}@upi`;
      } else {
        const cleanName = targetName.toLowerCase().replace(/[^a-z0-9]/g, '');
        upiId = `${cleanName || 'payee'}@okaxis`;
      }
    }

    return {
      avatarUrl,
      email,
      phoneNumber,
      upiId,
      groupName,
      isFriend,
      friendId,
    };
  };

  const youOweMap = new Map<string, PersonDebtDetail>();
  const oweYouMap = new Map<string, PersonDebtDetail>();

  // Process simplified debts
  for (const debt of simplified) {
    if (currentUser && isUserMatch({ userId: debt.fromUserId, name: debt.fromUserName }, currentUser)) {
      // Current user owes debt.toUserId / debt.toUserName
      const key = (debt.toUserId || debt.toUserName).toLowerCase();
      const existing = youOweMap.get(key);
      const profile = enrichProfile(debt.toUserId, debt.toUserName);
      const newAmount = (existing?.amount || 0) + debt.amount;

      youOweMap.set(key, {
        userId: debt.toUserId,
        name: debt.toUserName,
        amount: Math.round(newAmount * 100) / 100,
        currency: debt.currency,
        ...profile,
      });
    } else if (currentUser && isUserMatch({ userId: debt.toUserId, name: debt.toUserName }, currentUser)) {
      // debt.fromUserId / debt.fromUserName owes current user
      const key = (debt.fromUserId || debt.fromUserName).toLowerCase();
      const existing = oweYouMap.get(key);
      const profile = enrichProfile(debt.fromUserId, debt.fromUserName);
      const newAmount = (existing?.amount || 0) + debt.amount;

      oweYouMap.set(key, {
        userId: debt.fromUserId,
        name: debt.fromUserName,
        amount: Math.round(newAmount * 100) / 100,
        currency: debt.currency,
        ...profile,
      });
    }
  }

  // Merge any friends who have non-zero netBalance not already in the maps
  for (const f of friends) {
    if (f.netBalance < 0) {
      const key = (f.userId || f.name).toLowerCase();
      if (!youOweMap.has(key)) {
        youOweMap.set(key, {
          userId: f.userId,
          name: f.name,
          amount: Math.round(Math.abs(f.netBalance) * 100) / 100,
          currency: f.currency,
          avatarUrl: f.avatarUrl,
          email: f.email,
          phoneNumber: f.phoneNumber,
          upiId: f.upiId || `${f.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@okaxis`,
          isFriend: true,
          friendId: f.id,
        });
      }
    } else if (f.netBalance > 0) {
      const key = (f.userId || f.name).toLowerCase();
      if (!oweYouMap.has(key)) {
        oweYouMap.set(key, {
          userId: f.userId,
          name: f.name,
          amount: Math.round(f.netBalance * 100) / 100,
          currency: f.currency,
          avatarUrl: f.avatarUrl,
          email: f.email,
          phoneNumber: f.phoneNumber,
          upiId: f.upiId || `${f.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@okaxis`,
          isFriend: true,
          friendId: f.id,
        });
      }
    }
  }

  return {
    peopleYouOwe: Array.from(youOweMap.values()),
    peopleWhoOweYou: Array.from(oweYouMap.values()),
  };
}

