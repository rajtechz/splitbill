import {
  permissionService,
  PERMISSION_CONFIG,
  PermissionType,
} from '../../src/services/native/permissionService';

describe('PermissionService Unit Tests', () => {
  beforeEach(async () => {
    await permissionService.resetPermissionsOnboarding();
  });

  it('defines all 4 essential install-time permissions', () => {
    const requiredPermissions: PermissionType[] = [
      'location',
      'camera',
      'contacts',
      'notifications',
    ];

    requiredPermissions.forEach(perm => {
      expect(PERMISSION_CONFIG[perm]).toBeDefined();
      expect(PERMISSION_CONFIG[perm].title).toBeTruthy();
      expect(PERMISSION_CONFIG[perm].subtitle).toBeTruthy();
      expect(PERMISSION_CONFIG[perm].icon).toBeTruthy();
      expect(PERMISSION_CONFIG[perm].badge).toBeTruthy();
      expect(PERMISSION_CONFIG[perm].reason).toBeTruthy();
    });
  });

  it('tracks first-install onboarding completion state in storage', async () => {
    // 1. Initial state should be false (new install)
    const initialStatus = await permissionService.hasCompletedPermissionsOnboarding();
    expect(initialStatus).toBe(false);

    // 2. Mark completed
    await permissionService.setPermissionsOnboardingCompleted(true);
    const completedStatus = await permissionService.hasCompletedPermissionsOnboarding();
    expect(completedStatus).toBe(true);

    // 3. Reset works for re-prompting
    await permissionService.resetPermissionsOnboarding();
    const resetStatus = await permissionService.hasCompletedPermissionsOnboarding();
    expect(resetStatus).toBe(false);
  });

  it('requests individual permissions safely without throwing', async () => {
    const locResult = await permissionService.requestPermission('location');
    expect(typeof locResult).toBe('boolean');

    const camResult = await permissionService.requestPermission('camera');
    expect(typeof camResult).toBe('boolean');

    const ctResult = await permissionService.requestPermission('contacts');
    expect(typeof ctResult).toBe('boolean');

    const notifResult = await permissionService.requestPermission('notifications');
    expect(typeof notifResult).toBe('boolean');
  });

  it('executes requestAllPermissions and returns a complete status map', async () => {
    const results = await permissionService.requestAllPermissions();

    expect(results).toHaveProperty('location');
    expect(results).toHaveProperty('camera');
    expect(results).toHaveProperty('contacts');
    expect(results).toHaveProperty('notifications');
  });

  it('checks status of all permissions with getAllPermissionsStatus', async () => {
    const status = await permissionService.getAllPermissionsStatus();

    expect(status).toHaveProperty('location');
    expect(status).toHaveProperty('camera');
    expect(status).toHaveProperty('contacts');
    expect(status).toHaveProperty('notifications');
  });
});

