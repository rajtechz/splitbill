import {
  calculateBalances,
  calculateUserBalance,
  simplifyDebts,
  calculateSettlement,
} from '../../src/features/balances/calculations/debtEngine';
import { Expense, Settlement } from '../../src/types';

describe('Debt and Balance Calculation Engine', () => {
  it('correctly calculates balances when Person A pays full amount for B and C', () => {
    // Total 3000: A paid 3000, split 1000 each
    const expense: Expense = {
      id: 'e1',
      title: 'Cab ride',
      totalAmount: 3000,
      currency: 'INR',
      date: '2026-11-01',
      category: 'Transport',
      splitMethod: 'equally',
      createdBy: 'uA',
      createdAt: '2026-11-01T10:00:00Z',
      participants: [
        { userId: 'uA', name: 'Alice', paidAmount: 3000, shareAmount: 1000, netBalance: 2000 },
        { userId: 'uB', name: 'Bob', paidAmount: 0, shareAmount: 1000, netBalance: -1000 },
        { userId: 'uC', name: 'Charlie', paidAmount: 0, shareAmount: 1000, netBalance: -1000 },
      ],
    };

    const balances = calculateBalances([expense], [], 'INR');
    expect(balances['uA'].netAmount).toBe(2000); // Alice is owed 2000
    expect(balances['uB'].netAmount).toBe(-1000); // Bob owes 1000
    expect(balances['uC'].netAmount).toBe(-1000); // Charlie owes 1000

    const simplified = simplifyDebts([expense], [], 'INR');
    expect(simplified.length).toBe(2);
    // Both Bob and Charlie should pay Alice 1000
    const bobToAlice = simplified.find(d => d.fromUserId === 'uB' && d.toUserId === 'uA');
    const charlieToAlice = simplified.find(d => d.fromUserId === 'uC' && d.toUserId === 'uA');
    expect(bobToAlice?.amount).toBe(1000);
    expect(charlieToAlice?.amount).toBe(1000);
  });

  it('performs smart debt simplification (A owes B ₹500, B owes C ₹500 -> A pays C ₹500)', () => {
    // Expense 1: Bob paid 1000 for Alice and Bob (Alice owes Bob 500)
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

    // Expense 2: Charlie paid 1000 for Bob and Charlie (Bob owes Charlie 500)
    const exp2: Expense = {
      id: 'e2',
      title: 'Groceries',
      totalAmount: 1000,
      currency: 'INR',
      date: '2026-11-02',
      category: 'Groceries',
      splitMethod: 'equally',
      createdBy: 'uC',
      createdAt: '2026-11-02T10:00:00Z',
      participants: [
        { userId: 'uC', name: 'Charlie', paidAmount: 1000, shareAmount: 500, netBalance: 500 },
        { userId: 'uB', name: 'Bob', paidAmount: 0, shareAmount: 500, netBalance: -500 },
      ],
    };

    // Bob's net balance should be 0 (+500 from exp1, -500 from exp2)
    // Alice's net balance: -500
    // Charlie's net balance: +500
    const balances = calculateBalances([exp1, exp2], [], 'INR');
    expect(balances['uB'].netAmount).toBe(0);
    expect(balances['uA'].netAmount).toBe(-500);
    expect(balances['uC'].netAmount).toBe(500);

    const simplified = simplifyDebts([exp1, exp2], [], 'INR');
    // Simplified into single transaction: Alice pays Charlie 500 directly!
    expect(simplified.length).toBe(1);
    expect(simplified[0].fromUserId).toBe('uA');
    expect(simplified[0].toUserId).toBe('uC');
    expect(simplified[0].amount).toBe(500);
  });

  it('updates balances when a partial or full settlement is recorded', () => {
    const expense: Expense = {
      id: 'e1',
      title: 'Hotel',
      totalAmount: 2000,
      currency: 'INR',
      date: '2026-11-01',
      category: 'Travel',
      splitMethod: 'equally',
      createdBy: 'uA',
      createdAt: '2026-11-01T10:00:00Z',
      participants: [
        { userId: 'uA', name: 'Alice', paidAmount: 2000, shareAmount: 1000, netBalance: 1000 },
        { userId: 'uB', name: 'Bob', paidAmount: 0, shareAmount: 1000, netBalance: -1000 },
      ],
    };

    // Bob makes partial settlement of 600
    const settlement1: Settlement = {
      id: 's1',
      payerId: 'uB',
      payerName: 'Bob',
      receiverId: 'uA',
      receiverName: 'Alice',
      amount: 600,
      currency: 'INR',
      paymentMethod: 'UPI',
      status: 'CONFIRMED',
      date: '2026-11-02',
      createdAt: '2026-11-02T12:00:00Z',
    };

    let balances = calculateBalances([expense], [settlement1], 'INR');
    expect(balances['uA'].netAmount).toBe(400); // Alice is now owed only 400
    expect(balances['uB'].netAmount).toBe(-400); // Bob owes only 400

    // Bob settles the remaining 400
    const settlement2: Settlement = {
      id: 's2',
      payerId: 'uB',
      payerName: 'Bob',
      receiverId: 'uA',
      receiverName: 'Alice',
      amount: 400,
      currency: 'INR',
      paymentMethod: 'Cash',
      status: 'CONFIRMED',
      date: '2026-11-03',
      createdAt: '2026-11-03T12:00:00Z',
    };

    balances = calculateBalances([expense], [settlement1, settlement2], 'INR');
    expect(balances['uA'].netAmount).toBe(0);
    expect(balances['uB'].netAmount).toBe(0);

    const simplified = simplifyDebts([expense], [settlement1, settlement2], 'INR');
    expect(simplified.length).toBe(0); // Zero debts remaining
  });

  it('calculateSettlement utility returns remaining balance and settled flag', () => {
    const partial = calculateSettlement(1000, 450, 'INR');
    expect(partial.remainingDebt).toBe(550);
    expect(partial.isFullySettled).toBe(false);

    const full = calculateSettlement(1000, 1000, 'INR');
    expect(full.remainingDebt).toBe(0);
    expect(full.isFullySettled).toBe(true);

    const overpay = calculateSettlement(500, 600, 'INR');
    expect(overpay.remainingDebt).toBe(0);
    expect(overpay.isFullySettled).toBe(true);
  });

  it('calculates user balance summary accurately', () => {
    const expense: Expense = {
      id: 'e1',
      title: 'Dinner',
      totalAmount: 1200,
      currency: 'INR',
      date: '2026-11-01',
      category: 'Food',
      splitMethod: 'equally',
      createdBy: 'uA',
      createdAt: '2026-11-01T10:00:00Z',
      participants: [
        { userId: 'uA', name: 'Alice', paidAmount: 1200, shareAmount: 400, netBalance: 800 },
        { userId: 'uB', name: 'Bob', paidAmount: 0, shareAmount: 400, netBalance: -400 },
        { userId: 'uC', name: 'Charlie', paidAmount: 0, shareAmount: 400, netBalance: -400 },
      ],
    };

    const aliceSummary = calculateUserBalance('uA', [expense], [], 'INR');
    expect(aliceSummary.totalBalance).toBe(800);
    expect(aliceSummary.youOwe).toBe(0);
    expect(aliceSummary.youAreOwed).toBe(800);

    const bobSummary = calculateUserBalance('uB', [expense], [], 'INR');
    expect(bobSummary.totalBalance).toBe(-400);
    expect(bobSummary.youOwe).toBe(400);
    expect(bobSummary.youAreOwed).toBe(0);
  });
});

