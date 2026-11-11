import { CurrencyCode, SUPPORTED_CURRENCIES } from '../types';

/**
 * Money utilities using integer minor units (e.g. cents/paise) to prevent IEEE 754 floating point errors.
 */

export const toMinorUnits = (amount: number, currency: CurrencyCode = 'INR'): number => {
  const decimals = SUPPORTED_CURRENCIES[currency]?.decimals ?? 2;
  const factor = Math.pow(10, decimals);
  return Math.round(amount * factor);
};

export const fromMinorUnits = (minorUnits: number, currency: CurrencyCode = 'INR'): number => {
  const decimals = SUPPORTED_CURRENCIES[currency]?.decimals ?? 2;
  const factor = Math.pow(10, decimals);
  return minorUnits / factor;
};

export const roundMoney = (amount: number, decimals: number = 2): number => {
  const factor = Math.pow(10, decimals);
  return Math.round((amount + Number.EPSILON) * factor) / factor;
};

export const formatMoney = (
  amount: number,
  currency: CurrencyCode = 'INR',
  options?: { showSign?: boolean; absolute?: boolean }
): string => {
  const curr = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.INR;
  const absAmount = Math.abs(amount);
  const formattedNumber = absAmount.toLocaleString('en-IN', {
    minimumFractionDigits: curr.decimals,
    maximumFractionDigits: curr.decimals,
  });

  if (options?.absolute) {
    return `${curr.symbol}${formattedNumber}`;
  }

  if (options?.showSign) {
    if (amount > 0) return `+${curr.symbol}${formattedNumber}`;
    if (amount < 0) return `-${curr.symbol}${formattedNumber}`;
    return `${curr.symbol}${formattedNumber}`;
  }

  if (amount < 0) {
    return `-${curr.symbol}${formattedNumber}`;
  }

  return `${curr.symbol}${formattedNumber}`;
};

