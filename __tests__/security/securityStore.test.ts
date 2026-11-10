import { useSecurityStore } from '../../src/store/useSecurityStore';
import { biometricsService } from '../../src/services/native/biometricsService';

describe('Security Store & Dual Unlock (mPIN & Fingerprint)', () => {
  beforeEach(async () => {
    await useSecurityStore.getState().initializeSecurity();
  });

  it('initializes with mPIN and biometrics enabled by default', () => {
    const state = useSecurityStore.getState();
    expect(state.isPinEnabled).toBe(true);
    expect(state.hasPinSet).toBe(true);
    expect(state.isLocked).toBe(true);
    expect(state.isBiometricsEnabled).toBe(true);
  });

  it('unlocks successfully with default PIN 1234', () => {
    const success = useSecurityStore.getState().unlock('1234');
    expect(success).toBe(true);
    expect(useSecurityStore.getState().isLocked).toBe(false);
    expect(useSecurityStore.getState().failedAttempts).toBe(0);
  });

  it('rejects incorrect PIN and increments failed attempts', () => {
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
  });

  it('locks when lock() is called if PIN is enabled', () => {
    useSecurityStore.getState().unlock('1234');
    expect(useSecurityStore.getState().isLocked).toBe(false);

    useSecurityStore.getState().lock();
    expect(useSecurityStore.getState().isLocked).toBe(true);
  });

  it('toggles biometrics on and off', async () => {
    await useSecurityStore.getState().toggleBiometrics(false);
    expect(useSecurityStore.getState().isBiometricsEnabled).toBe(false);

    await useSecurityStore.getState().toggleBiometrics(true);
    expect(useSecurityStore.getState().isBiometricsEnabled).toBe(true);
  });

  it('unlocks directly or via biometrics service', async () => {
    useSecurityStore.getState().lock();
    expect(useSecurityStore.getState().isLocked).toBe(true);

    // Mock biometricsService.authenticate to return success
    jest.spyOn(biometricsService, 'authenticate').mockResolvedValueOnce({ success: true });

    const success = await useSecurityStore.getState().unlockWithBiometrics();
    expect(success).toBe(true);
    expect(useSecurityStore.getState().isLocked).toBe(false);
  });
});
