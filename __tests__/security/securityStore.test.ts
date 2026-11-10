import { useSecurityStore } from '../../src/store/useSecurityStore';
import { biometricsService } from '../../src/services/native/biometricsService';

describe('Security Store & Dual Unlock (mPIN & Fingerprint) - Option A', () => {
  beforeEach(async () => {
    // Reset to default
    await useSecurityStore.getState().disablePin();
    await useSecurityStore.getState().initializeSecurity();
  });

  it('initializes with mPIN and biometrics disabled by default (friction-free)', () => {
    const state = useSecurityStore.getState();
    expect(state.isPinEnabled).toBe(false);
    expect(state.isLocked).toBe(false);
  });

  it('allows user to enable PIN lock by setting a PIN', async () => {
    await useSecurityStore.getState().setPin('1234');
    const state = useSecurityStore.getState();
    expect(state.isPinEnabled).toBe(true);
    expect(state.hasPinSet).toBe(true);
    expect(state.isLocked).toBe(false);
  });

  it('unlocks successfully with set PIN', async () => {
    await useSecurityStore.getState().setPin('1234');
    useSecurityStore.getState().lock();
    expect(useSecurityStore.getState().isLocked).toBe(true);

    const success = useSecurityStore.getState().unlock('1234');
    expect(success).toBe(true);
    expect(useSecurityStore.getState().isLocked).toBe(false);
    expect(useSecurityStore.getState().failedAttempts).toBe(0);
  });

  it('rejects incorrect PIN and increments failed attempts', async () => {
    await useSecurityStore.getState().setPin('1234');
    useSecurityStore.getState().lock();

    const success = useSecurityStore.getState().unlock('9999');
    expect(success).toBe(false);
    expect(useSecurityStore.getState().isLocked).toBe(true);
    expect(useSecurityStore.getState().failedAttempts).toBeGreaterThan(0);
  });

  it('allows user to set a new custom PIN and unlock with it', async () => {
    await useSecurityStore.getState().setPin('5678');
    expect(useSecurityStore.getState().isLocked).toBe(false);

    // Lock again
    useSecurityStore.getState().lock();
    expect(useSecurityStore.getState().isLocked).toBe(true);

    const success = useSecurityStore.getState().unlock('5678');
    expect(success).toBe(true);
  });

  it('does not lock if PIN is disabled', async () => {
    await useSecurityStore.getState().disablePin();
    expect(useSecurityStore.getState().isPinEnabled).toBe(false);

    useSecurityStore.getState().lock();
    expect(useSecurityStore.getState().isLocked).toBe(false);
  });

  it('toggles biometrics on and off', async () => {
    await useSecurityStore.getState().toggleBiometrics(true);
    expect(useSecurityStore.getState().isBiometricsEnabled).toBe(true);

    await useSecurityStore.getState().toggleBiometrics(false);
    expect(useSecurityStore.getState().isBiometricsEnabled).toBe(false);
  });

  it('unlocks directly or via biometrics service when enabled', async () => {
    await useSecurityStore.getState().setPin('1234');
    await useSecurityStore.getState().toggleBiometrics(true);
    useSecurityStore.getState().lock();
    expect(useSecurityStore.getState().isLocked).toBe(true);

    // Mock biometricsService.authenticate to return success
    jest.spyOn(biometricsService, 'authenticate').mockResolvedValueOnce({ success: true });

    const success = await useSecurityStore.getState().unlockWithBiometrics();
    expect(success).toBe(true);
    expect(useSecurityStore.getState().isLocked).toBe(false);
  });
});
