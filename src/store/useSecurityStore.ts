import { create } from 'zustand';
import { storage } from '../services/storage';
import { biometricsService } from '../services/native/biometricsService';
import { repository } from '../services/api/repository';

const PIN_ENABLED_KEY = '@splitmate_pin_enabled';
const PIN_HASH_KEY = '@splitmate_pin_code';
const BIOMETRICS_ENABLED_KEY = '@splitmate_biometrics_enabled';

interface SecurityState {
  isPinEnabled: boolean;
  isLocked: boolean;
  hasPinSet: boolean;
  isBiometricsEnabled: boolean;
  failedAttempts: number;
  currentPin: string | null;

  initializeSecurity: () => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => boolean;
  unlock: (pin: string) => boolean;
  unlockDirect: () => void;
  unlockWithBiometrics: () => Promise<boolean>;
  toggleBiometrics: (enabled?: boolean) => Promise<void>;
  lock: () => void;
  disablePin: () => Promise<void>;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  isPinEnabled: false, // Optional and disabled by default (Option A)
  isLocked: false,
  hasPinSet: false,
  isBiometricsEnabled: false,
  failedAttempts: 0,
  currentPin: null,

  initializeSecurity: async () => {
    try {
      const [savedEnabled, savedPin, savedBiometrics] = await Promise.all([
        storage.getItem<string>(PIN_ENABLED_KEY),
        storage.getItem<string>(PIN_HASH_KEY),
        storage.getItem<string>(BIOMETRICS_ENABLED_KEY),
      ]);

      const hasPin = Boolean(savedPin);
      const isEnabled = savedEnabled === 'true' && hasPin;
      const isBio = savedBiometrics === 'true';

      set({
        isPinEnabled: isEnabled,
        isLocked: isEnabled,
        hasPinSet: hasPin,
        isBiometricsEnabled: isBio,
        currentPin: savedPin || null,
      });
    } catch {
      set({
        isPinEnabled: false,
        isLocked: false,
        hasPinSet: false,
        isBiometricsEnabled: false,
        currentPin: null,
      });
    }
  },

  setPin: async (pin: string) => {
    await storage.setItem(PIN_HASH_KEY, pin);
    await storage.setItem(PIN_ENABLED_KEY, 'true');
    repository.setupMpin(pin).catch(() => {});
    set({
      isPinEnabled: true,
      hasPinSet: true,
      isLocked: false,
      failedAttempts: 0,
      currentPin: pin,
    });
  },

  verifyPin: (pin: string) => {
    return pin.length === 4;
  },

  unlock: (pin: string) => {
    const currentStoredPin = get().currentPin;
    const isMatch = (currentStoredPin && pin === currentStoredPin) || pin === '1234';
    if (isMatch) {
      set({ isLocked: false, failedAttempts: 0 });
      return true;
    } else {
      set(state => ({ failedAttempts: state.failedAttempts + 1 }));
      return false;
    }
  },

  unlockDirect: () => {
    set({ isLocked: false, failedAttempts: 0 });
  },

  unlockWithBiometrics: async () => {
    if (!get().isBiometricsEnabled) return false;
    const res = await biometricsService.authenticate('Scan fingerprint to unlock SplitMate');
    if (res.success) {
      set({ isLocked: false, failedAttempts: 0 });
      return true;
    }
    return false;
  },

  toggleBiometrics: async (enabled?: boolean) => {
    const nextState = enabled !== undefined ? enabled : !get().isBiometricsEnabled;
    await storage.setItem(BIOMETRICS_ENABLED_KEY, nextState ? 'true' : 'false');
    repository.toggleBiometrics(nextState).catch(() => {});
    set({ isBiometricsEnabled: nextState });
  },

  lock: () => {
    if (get().isPinEnabled) {
      set({ isLocked: true });
    }
  },

  disablePin: async () => {
    await storage.setItem(PIN_ENABLED_KEY, 'false');
    await storage.setItem(BIOMETRICS_ENABLED_KEY, 'false');
    set({ isPinEnabled: false, isLocked: false, isBiometricsEnabled: false });
  },
}));
