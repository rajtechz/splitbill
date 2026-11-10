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
  const targetAmount = options?.absolute ? Math.abs(amount) : amount;
  const formattedNumber = targetAmount.toLocaleString('en-IN', {
    minimumFractionDigits: curr.decimals,
    maximumFractionDigits: curr.decimals,
  });

  const sign = options?.showSign && amount > 0 ? '+' : options?.showSign && amount < 0 ? '-' : '';

  return `${sign}${curr.symbol}${formattedNumber}`;
};

