import { CurrencyCode, SplitMethod } from '../../../types';
import { toMinorUnits, fromMinorUnits } from '../../../utils/money';

export interface SplitResult {
  userId: string;
  shareAmount: number;
  minorUnits: number;
}

export interface SplitCalculationOutput {
  shares: Record<string, number>; // userId -> shareAmount
  totalCalculated: number;
  remainder: number;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Distributes remainder cents/paise one-by-one to participants
 * to guarantee that sum(shares) === totalAmount exactly.
 */
function distributeMinorUnits(
  totalMinor: number,
  baseSharesMinor: { userId: string; amount: number; weightForRemainder?: number }[],
  currency: CurrencyCode
): SplitCalculationOutput {
  const sumBase = baseSharesMinor.reduce((acc, curr) => acc + curr.amount, 0);
  let remainder = totalMinor - sumBase;

  // Clone shares
  const result: Record<string, number> = {};
  const sharesWithRemainder = baseSharesMinor.map(item => ({ ...item }));

  // Sort by weight if available (e.g. who has largest fractional share), or deterministic order
  if (remainder !== 0) {
    const step = remainder > 0 ? 1 : -1;
    let idx = 0;
    while (remainder !== 0 && baseSharesMinor.length > 0) {
      sharesWithRemainder[idx % sharesWithRemainder.length].amount += step;
      remainder -= step;
      idx++;
    }
  }

  let finalSumMinor = 0;
  for (const item of sharesWithRemainder) {
    const major = fromMinorUnits(item.amount, currency);
    result[item.userId] = major;
    finalSumMinor += item.amount;
  }

  return {
    shares: result,
    totalCalculated: fromMinorUnits(finalSumMinor, currency),
    remainder: 0,
    isValid: true,
  };
}

/**
 * Split equally among participants.
 * Handles odd divisions (e.g. ₹100 / 3 = ₹33.34, ₹33.33, ₹33.33 -> sum = ₹100.00).
 */
export function calculateEqualSplit(
  totalAmount: number,
  participantIds: string[],
  currency: CurrencyCode = 'INR'
): SplitCalculationOutput {
  if (totalAmount <= 0) {
    return {
      shares: {},
      totalCalculated: 0,
      remainder: 0,
      isValid: false,
      errorMessage: 'Total amount must be greater than zero',
    };
  }

  if (!participantIds || participantIds.length === 0) {
    return {
      shares: {},
      totalCalculated: 0,
      remainder: 0,
      isValid: false,
      errorMessage: 'At least one participant is required',
    };
  }

  const totalMinor = toMinorUnits(totalAmount, currency);
  const count = participantIds.length;
  const baseShareMinor = Math.floor(totalMinor / count);

  const baseShares = participantIds.map(userId => ({
    userId,
    amount: baseShareMinor,
  }));

  return distributeMinorUnits(totalMinor, baseShares, currency);
}

/**
 * Split by exact amounts.
 * Checks that sum of exact amounts equals total amount down to minor units.
 */
export function calculateExactSplit(
  totalAmount: number,
  exactAmounts: Record<string, number>,
  currency: CurrencyCode = 'INR'
): SplitCalculationOutput {
  const totalMinor = toMinorUnits(totalAmount, currency);
  const userIds = Object.keys(exactAmounts);

  let sumMinor = 0;
  const shares: Record<string, number> = {};

  for (const uid of userIds) {
    const amt = exactAmounts[uid] || 0;
    if (amt < 0) {
      return {
        shares: {},
        totalCalculated: 0,
        remainder: 0,
        isValid: false,
        errorMessage: 'Amounts cannot be negative',
      };
    }
    const minor = toMinorUnits(amt, currency);
    sumMinor += minor;
    shares[uid] = fromMinorUnits(minor, currency);
  }

  const diffMinor = totalMinor - sumMinor;
  if (diffMinor !== 0) {
    const diffMajor = fromMinorUnits(Math.abs(diffMinor), currency);
    return {
      shares,
      totalCalculated: fromMinorUnits(sumMinor, currency),
      remainder: fromMinorUnits(diffMinor, currency),
      isValid: false,
      errorMessage:
        diffMinor > 0
          ? `Amounts are short by ${diffMajor} ${currency}`
          : `Amounts exceed total by ${diffMajor} ${currency}`,
    };
  }

  return {
    shares,
    totalCalculated: fromMinorUnits(sumMinor, currency),
    remainder: 0,
    isValid: true,
  };
}

/**
 * Split unequally (same logic as exact split with unequal values).
 */
export function calculateUnequalSplit(
  totalAmount: number,
  amounts: Record<string, number>,
  currency: CurrencyCode = 'INR'
): SplitCalculationOutput {
  return calculateExactSplit(totalAmount, amounts, currency);
}

/**
 * Split by percentage.
 * Total percentages must equal 100%. Penny rounding is automatically balanced.
 */
export function calculatePercentageSplit(
  totalAmount: number,
  percentages: Record<string, number>,
  currency: CurrencyCode = 'INR'
): SplitCalculationOutput {
  const userIds = Object.keys(percentages);
  let totalPercent = 0;

  for (const uid of userIds) {
    const p = percentages[uid] || 0;
    if (p < 0) {
      return {
        shares: {},
        totalCalculated: 0,
        remainder: 0,
        isValid: false,
        errorMessage: 'Percentages cannot be negative',
      };
    }
    totalPercent += p;
  }

  // Allow small rounding tolerance for 100% input (e.g. 33.33 + 33.33 + 33.34 = 100)
  if (Math.abs(totalPercent - 100) > 0.01) {
    return {
      shares: {},
      totalCalculated: 0,
      remainder: 0,
      isValid: false,
      errorMessage: `Percentages sum to ${totalPercent.toFixed(2)}%, must equal 100%`,
    };
  }

  const totalMinor = toMinorUnits(totalAmount, currency);
  const baseShares = userIds.map(userId => {
    const p = percentages[userId] || 0;
    const shareMinor = Math.round((totalMinor * p) / 100);
    return {
      userId,
      amount: shareMinor,
      weightForRemainder: (totalMinor * p) / 100 - shareMinor,
    };
  });

  return distributeMinorUnits(totalMinor, baseShares, currency);
}

/**
 * Split by shares (ratio weights, e.g. Person A has 2 shares, Person B has 1 share).
 */
export function calculateShareSplit(
  totalAmount: number,
  sharesCount: Record<string, number>,
  currency: CurrencyCode = 'INR'
): SplitCalculationOutput {
  const userIds = Object.keys(sharesCount);
  let totalShares = 0;

  for (const uid of userIds) {
    const s = sharesCount[uid] || 0;
    if (s < 0) {
      return {
        shares: {},
        totalCalculated: 0,
        remainder: 0,
        isValid: false,
        errorMessage: 'Shares cannot be negative',
      };
    }
    totalShares += s;
  }

  if (totalShares <= 0) {
    return {
      shares: {},
      totalCalculated: 0,
      remainder: 0,
      isValid: false,
      errorMessage: 'Total shares must be greater than zero',
    };
  }

  const totalMinor = toMinorUnits(totalAmount, currency);
  const baseShares = userIds.map(userId => {
    const s = sharesCount[userId] || 0;
    const shareMinor = Math.floor((totalMinor * s) / totalShares);
    return {
      userId,
      amount: shareMinor,
    };
  });

  return distributeMinorUnits(totalMinor, baseShares, currency);
}

export interface ValidateExpenseParams {
  title: string;
  totalAmount: number;
  paidBy: { userId: string; amount: number }[];
  splitMethod: SplitMethod;
  splitDetails: {
    participantIds?: string[];
    exactAmounts?: Record<string, number>;
    percentages?: Record<string, number>;
    shares?: Record<string, number>;
  };
  currency?: CurrencyCode;
}

export function validateExpense(params: ValidateExpenseParams): {
  isValid: boolean;
  errors: string[];
  calculatedShares?: Record<string, number>;
} {
  const errors: string[] = [];
  const currency = params.currency || 'INR';

  if (!params.title || params.title.trim().length === 0) {
    errors.push('Expense title is required');
  }

  if (!params.totalAmount || params.totalAmount <= 0) {
    errors.push('Total amount must be greater than 0');
  }

  const totalMinor = toMinorUnits(params.totalAmount, currency);

  // Validate payers
  const paidSumMinor = params.paidBy.reduce((acc, p) => acc + toMinorUnits(p.amount, currency), 0);
  if (paidSumMinor !== totalMinor) {
    const diff = fromMinorUnits(Math.abs(totalMinor - paidSumMinor), currency);
    errors.push(
      paidSumMinor < totalMinor
        ? `Paid amount is short by ${diff} ${currency}`
        : `Paid amount exceeds total by ${diff} ${currency}`
    );
  }

  // Validate split method
  let splitResult: SplitCalculationOutput | null = null;
  switch (params.splitMethod) {
    case 'equally':
      splitResult = calculateEqualSplit(params.totalAmount, params.splitDetails.participantIds || [], currency);
      break;
    case 'exact':
    case 'unequally':
      splitResult = calculateExactSplit(params.totalAmount, params.splitDetails.exactAmounts || {}, currency);
      break;
    case 'percentage':
      splitResult = calculatePercentageSplit(params.totalAmount, params.splitDetails.percentages || {}, currency);
      break;
    case 'shares':
      splitResult = calculateShareSplit(params.totalAmount, params.splitDetails.shares || {}, currency);
      break;
  }

  if (splitResult && !splitResult.isValid) {
    errors.push(splitResult.errorMessage || 'Invalid split configuration');
  }

  return {
    isValid: errors.length === 0,
    errors,
    calculatedShares: splitResult?.shares,
  };
}

