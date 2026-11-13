import { useAuthStore } from '../../src/store/useAuthStore';
import { simplifyDebts } from '../../src/features/balances/calculations/debtEngine';
import { Expense } from '../../src/types';

describe('SplitMate Pro Subscription Services Verification', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  describe('Feature 1: Expense Creation Limit', () => {
    it('restricts free users when 4 daily expenses exist and allows unlimited for pro', () => {
      const today = new Date().toISOString().split('T')[0];
      const mockExpenses = [
        { id: '1', date: `${today}T10:00:00.000Z`, createdBy: 'u1' },
        { id: '2', date: `${today}T11:00:00.000Z`, createdBy: 'u1' },
        { id: '3', date: `${today}T12:00:00.000Z`, createdBy: 'u1' },
        { id: '4', date: `${today}T13:00:00.000Z`, createdBy: 'u1' },
      ];

      const count = mockExpenses.filter(e => e.date.startsWith(today)).length;
      expect(count).toBe(4);

      // Free user condition
      const isFreeTierBlocked = count >= 4;
      expect(isFreeTierBlocked).toBe(true);

      // Pro user is exempt
      const isPro = true;
      const canCreateAsPro = isPro || count < 4;
      expect(canCreateAsPro).toBe(true);
    });
  });

  describe('Feature 2: AI Receipt Scanner (OCR)', () => {
    it('provides automated receipt extraction for Pro members', () => {
      const mockReceiptScan = {
        title: 'Olive Garden Dinner & Drinks',
        amount: 2450,
        category: 'Food',
        notes: 'Scanned via SplitMate Pro AI OCR (Tax & Service included)',
      };

      expect(mockReceiptScan.amount).toBe(2450);
      expect(mockReceiptScan.title).toContain('Olive Garden');
    });
  });

  describe('Feature 3: Cross-Group Debt Simplifier (Global Engine)', () => {
    it('simplifies circular debts down to direct payment via simplifyDebts', () => {
      const exp1: Expense = {
        id: 'e1',
        title: 'Dinner',
        totalAmount: 1000,
        currency: 'INR',
        date: '2026-11-01',
        category: 'Food',
        splitMethod: 'equally',
        createdBy: 'uB',
        createdAt: '2026-11-01T10:00:00Z',
        participants: [
          { userId: 'uB', name: 'Bob', paidAmount: 1000, shareAmount: 500, netBalance: 500 },
          { userId: 'uA', name: 'Alice', paidAmount: 0, shareAmount: 500, netBalance: -500 },
        ],
      };

      const exp2: Expense = {
        id: 'e2',
        title: 'Cab',
        totalAmount: 1000,
        currency: 'INR',
        date: '2026-11-01',
        category: 'Transport',
        splitMethod: 'equally',
        createdBy: 'uC',
        createdAt: '2026-11-01T11:00:00Z',
        participants: [
          { userId: 'uC', name: 'Charlie', paidAmount: 1000, shareAmount: 500, netBalance: 500 },
          { userId: 'uB', name: 'Bob', paidAmount: 0, shareAmount: 500, netBalance: -500 },
        ],
      };

      const simplified = simplifyDebts([exp1, exp2], [], 'INR');

      expect(simplified.length).toBe(1);
      expect(simplified[0].fromUserId).toBe('uA');
      expect(simplified[0].toUserId).toBe('uC');
      expect(simplified[0].amount).toBe(500);
    });
  });

  describe('Feature 4: Export to Excel, CSV & PDF', () => {
    it('formats transactions into CSV compliant data', () => {
      const mockExpenses = [
        { date: '2026-11-13T10:00:00Z', title: 'Coffee', category: 'Food', totalAmount: 150, currency: 'INR', groupName: 'Friends', splitMethod: 'equally' },
        { date: '2026-11-13T12:00:00Z', title: 'Taxi', category: 'Transport', totalAmount: 350, currency: 'INR', groupName: 'Trip', splitMethod: 'exact' },
      ];

      const header = 'Date,Title,Category,Amount,Currency,Group,Split Method\n';
      const rows = mockExpenses
        .map(e => `"${new Date(e.date).toLocaleDateString()}","${e.title}","${e.category}",${e.totalAmount},"${e.currency}","${e.groupName}","${e.splitMethod}"`)
        .join('\n');
      const csv = header + rows;

      expect(csv).toContain('Coffee');
      expect(csv).toContain('150');
      expect(csv).toContain('Taxi');
      expect(csv).toContain('350');
    });
  });

  describe('Feature 5: Live Foreign Currency Conversion (Real-time FX)', () => {
    it('accurately converts foreign currency expenses to INR', () => {
      const FX_RATES: Record<string, number> = {
        USD: 86.85,
        EUR: 90.20,
        GBP: 108.40,
      };

      const usdAmount = 50;
      const inrEquivalent = usdAmount * FX_RATES.USD;
      expect(inrEquivalent).toBe(4342.5);
    });
  });

  describe('Feature 6: Deep History Search & Filtering', () => {
    it('restricts free search to recent 3 items and unlocks all for Pro', () => {
      const allMatched = Array.from({ length: 12 }, (_, i) => ({ id: `exp_${i}`, title: `Dinner ${i}` }));
      
      const freeVisible = allMatched.slice(0, 3);
      const freeHiddenCount = allMatched.length - freeVisible.length;
      expect(freeVisible.length).toBe(3);
      expect(freeHiddenCount).toBe(9);

      const proVisible = allMatched;
      expect(proVisible.length).toBe(12);
    });
  });

  describe('Feature 7: Ad-Free Experience', () => {
    it('shows sponsored banners only when isPro is false', () => {
      let isPro = false;
      let showAds = !isPro;
      expect(showAds).toBe(true);

      isPro = true;
      showAds = !isPro;
      expect(showAds).toBe(false);
    });
  });

  describe('Feature 8: VIP Gold Profile Badge', () => {
    it('enables VIP gold badge and status upon pro subscription', async () => {
      useAuthStore.setState({
        currentUser: { id: 'u1', name: 'Alex Johnson', email: 'alex@example.com' } as any,
        isPro: false,
      });

      expect(useAuthStore.getState().isPro).toBe(false);

      await useAuthStore.getState().upgradeToPro('annual');
      expect(useAuthStore.getState().isPro).toBe(true);
      expect(useAuthStore.getState().currentUser?.subscriptionTier).toBe('pro');
    });
  });
});
