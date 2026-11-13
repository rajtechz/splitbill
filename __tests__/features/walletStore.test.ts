import { useWalletStore } from '../../src/store/useWalletStore';

describe('SplitMate Digital Wallet Store Verification', () => {
  beforeEach(async () => {
    await useWalletStore.getState().resetWallet();
  });

  it('initializes with a starting balance of ₹5,000.00 and welcome credit transaction', () => {
    const state = useWalletStore.getState();
    expect(state.balance).toBe(5000);
    expect(state.currency).toBe('INR');
    expect(state.transactions.length).toBeGreaterThan(0);
    expect(state.transactions[0].type).toBe('deposit');
  });

  it('allows adding money into the wallet and records deposit transaction', async () => {
    const addResult = await useWalletStore.getState().addFunds(1500, 'UPI (PhonePe)');
    expect(addResult.success).toBe(true);

    const state = useWalletStore.getState();
    expect(state.balance).toBe(6500);
    expect(state.transactions[0].amount).toBe(1500);
    expect(state.transactions[0].type).toBe('deposit');
    expect(state.transactions[0].paymentMethod).toBe('UPI (PhonePe)');
  });

  it('allows transferring money from wallet to bank account and prevents overdraft', async () => {
    // 1. Attempt transfer exceeding balance
    const overResult = await useWalletStore.getState().withdrawToBank(10000, {
      accountHolder: 'KD',
      accountNumber: '123456789012',
      ifsc: 'HDFC0001234',
    });
    expect(overResult.success).toBe(false);
    expect(overResult.message).toContain('Insufficient');
    expect(useWalletStore.getState().balance).toBe(5000);

    // 2. Successful bank transfer
    const withdrawResult = await useWalletStore.getState().withdrawToBank(2000, {
      accountHolder: 'KD',
      accountNumber: '123456789012',
      ifsc: 'HDFC0001234',
    });
    expect(withdrawResult.success).toBe(true);
    expect(useWalletStore.getState().balance).toBe(3000);

    const latestTx = useWalletStore.getState().transactions[0];
    expect(latestTx.type).toBe('withdrawal');
    expect(latestTx.amount).toBe(2000);
    expect(latestTx.bankDetails?.accountHolder).toBe('KD');
    expect(latestTx.referenceId).toMatch(/^NEFT-/);
  });

  it('allows 1-tap settlement payment from wallet and records transaction', async () => {
    const payResult = await useWalletStore.getState().payFromWallet(500, 'Daniel Higgins');
    expect(payResult.success).toBe(true);
    expect(useWalletStore.getState().balance).toBe(4500);

    const latestTx = useWalletStore.getState().transactions[0];
    expect(latestTx.type).toBe('settlement_payment');
    expect(latestTx.amount).toBe(500);
    expect(latestTx.title).toContain('Daniel Higgins');
  });

  it('credits the wallet when receiving settlement payment', async () => {
    await useWalletStore.getState().receiveIntoWallet(800, 'David Taylor');
    expect(useWalletStore.getState().balance).toBe(5800);

    const latestTx = useWalletStore.getState().transactions[0];
    expect(latestTx.type).toBe('settlement_received');
    expect(latestTx.amount).toBe(800);
    expect(latestTx.title).toContain('David Taylor');
  });
});

