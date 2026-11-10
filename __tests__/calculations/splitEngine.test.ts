import {
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentageSplit,
  calculateShareSplit,
  validateExpense,
} from '../../src/features/expenses/calculations/splitEngine';

describe('Split Engine Calculations', () => {
  describe('calculateEqualSplit', () => {
    it('splits evenly when divisible', () => {
      const res = calculateEqualSplit(3000, ['user1', 'user2', 'user3'], 'INR');
      expect(res.isValid).toBe(true);
      expect(res.shares['user1']).toBe(1000);
      expect(res.shares['user2']).toBe(1000);
      expect(res.shares['user3']).toBe(1000);
      expect(res.totalCalculated).toBe(3000);
    });

    it('handles penny rounding without losing money (100 / 3)', () => {
      const res = calculateEqualSplit(100, ['user1', 'user2', 'user3'], 'INR');
      expect(res.isValid).toBe(true);
      const sum = res.shares['user1'] + res.shares['user2'] + res.shares['user3'];
      expect(Math.round(sum * 100) / 100).toBe(100);
      // Remainder cent goes to first participant
      expect(res.shares['user1']).toBe(33.34);
      expect(res.shares['user2']).toBe(33.33);
      expect(res.shares['user3']).toBe(33.33);
    });

    it('rejects zero or negative amounts', () => {
      const resZero = calculateEqualSplit(0, ['user1'], 'INR');
      expect(resZero.isValid).toBe(false);
      const resNeg = calculateEqualSplit(-50, ['user1'], 'INR');
      expect(resNeg.isValid).toBe(false);
    });

    it('rejects empty participants array', () => {
      const res = calculateEqualSplit(500, [], 'INR');
      expect(res.isValid).toBe(false);
    });
  });

  describe('calculateExactSplit', () => {
    it('validates correct exact amounts matching total', () => {
      const res = calculateExactSplit(
        1500,
        { user1: 500, user2: 700, user3: 300 },
        'INR'
      );
      expect(res.isValid).toBe(true);
      expect(res.shares['user1']).toBe(500);
      expect(res.shares['user2']).toBe(700);
      expect(res.shares['user3']).toBe(300);
    });

    it('fails when amounts do not match total', () => {
      const res = calculateExactSplit(
        1500,
        { user1: 500, user2: 700, user3: 200 }, // sum = 1400 != 1500
        'INR'
      );
      expect(res.isValid).toBe(false);
      expect(res.errorMessage).toContain('short by 100');
    });

    it('fails when negative values provided', () => {
      const res = calculateExactSplit(100, { user1: 150, user2: -50 }, 'INR');
      expect(res.isValid).toBe(false);
      expect(res.errorMessage).toContain('cannot be negative');
    });
  });

  describe('calculatePercentageSplit', () => {
    it('calculates proportional splits by percentage', () => {
      const res = calculatePercentageSplit(
        2000,
        { user1: 50, user2: 30, user3: 20 },
        'INR'
      );
      expect(res.isValid).toBe(true);
      expect(res.shares['user1']).toBe(1000);
      expect(res.shares['user2']).toBe(600);
      expect(res.shares['user3']).toBe(400);
      expect(res.totalCalculated).toBe(2000);
    });

    it('handles rounding when percentages produce fractional cents', () => {
      const res = calculatePercentageSplit(
        100,
        { user1: 33.33, user2: 33.33, user3: 33.34 },
        'INR'
      );
      expect(res.isValid).toBe(true);
      const sum = res.shares['user1'] + res.shares['user2'] + res.shares['user3'];
      expect(Math.round(sum * 100) / 100).toBe(100);
    });

    it('rejects percentages not summing to 100%', () => {
      const res = calculatePercentageSplit(
        1000,
        { user1: 40, user2: 40 },
        'INR'
      );
      expect(res.isValid).toBe(false);
      expect(res.errorMessage).toContain('must equal 100%');
    });
  });

  describe('calculateShareSplit', () => {
    it('splits proportionally by ratio of shares', () => {
      // 3000 split 2 : 1 : 1 -> total 4 parts => 1500, 750, 750
      const res = calculateShareSplit(
        3000,
        { user1: 2, user2: 1, user3: 1 },
        'INR'
      );
      expect(res.isValid).toBe(true);
      expect(res.shares['user1']).toBe(1500);
      expect(res.shares['user2']).toBe(750);
      expect(res.shares['user3']).toBe(750);
      expect(res.totalCalculated).toBe(3000);
    });
  });

  describe('validateExpense', () => {
    it('passes complete valid expense with multiple payers', () => {
      const validation = validateExpense({
        title: 'Team Dinner',
        totalAmount: 1000,
        paidBy: [
          { userId: 'u1', amount: 600 },
          { userId: 'u2', amount: 400 },
        ],
        splitMethod: 'equally',
        splitDetails: {
          participantIds: ['u1', 'u2'],
        },
        currency: 'INR',
      });
      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
      expect(validation.calculatedShares?.['u1']).toBe(500);
      expect(validation.calculatedShares?.['u2']).toBe(500);
    });

    it('catches payer sum mismatch', () => {
      const validation = validateExpense({
        title: 'Snacks',
        totalAmount: 1000,
        paidBy: [{ userId: 'u1', amount: 800 }], // 800 != 1000
        splitMethod: 'equally',
        splitDetails: { participantIds: ['u1', 'u2'] },
        currency: 'INR',
      });
      expect(validation.isValid).toBe(false);
      expect(validation.errors[0]).toContain('Paid amount is short by 200');
    });
  });
});

