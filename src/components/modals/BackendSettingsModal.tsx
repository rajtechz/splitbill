import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import axios from 'axios';
import { useTheme } from '../../theme';
import { config, updateConfig, DEFAULT_DEV_API_URLS } from '../../app/config';
import { storage } from '../../services/storage';
import { Icon } from '../common/Icon';
import { useAppStore } from '../../store/useAppStore';

interface BackendSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const BackendSettingsModal: React.FC<BackendSettingsModalProps> = ({ visible, onClose }) => {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const { refreshAll } = useAppStore();

  const [useMock, setUseMock] = useState(config.useMockApi);
  const [baseUrl, setBaseUrl] = useState(config.apiBaseUrl);
  const [testingStatus, setTestingStatus] = useState<{
    testing: boolean;
    success?: boolean;
    message?: string;
  }>({ testing: false });

  useEffect(() => {
    if (visible) {
      setUseMock(config.useMockApi);
      setBaseUrl(config.apiBaseUrl);
      setTestingStatus({ testing: false });
    }
  }, [visible]);

  const testConnection = async () => {
    setTestingStatus({ testing: true });
    const startTime = Date.now();
    try {
      const targetUrl = baseUrl.trim().replace(/\/+$/, '');
      const res = await axios.get(`${targetUrl}/health`, { timeout: 4000 }).catch(async () => {
        // Fallback root endpoint test if /health is not defined yet
        return await axios.get(targetUrl, { timeout: 4000 });
      });
      const latency = Date.now() - startTime;
      setTestingStatus({
        testing: false,
        success: true,
        message: `Connected successfully! (HTTP ${res.status} in ${latency}ms)`,
      });
    } catch (err: any) {
      const latency = Date.now() - startTime;
      let msg = 'Connection failed';
      if (err.code === 'ECONNABORTED') {
        msg = 'Connection timed out (>4000ms)';
      } else if (err.message?.includes('Network Error')) {
        msg = Platform.OS === 'android'
          ? 'Network error. For Android emulator use 10.0.2.2 instead of localhost.'
          : 'Network error. Make sure your local server is running.';
      } else if (err.response?.status) {
        // Any HTTP response means server is alive!
        setTestingStatus({
          testing: false,
          success: true,
          message: `Backend reachable! (HTTP ${err.response.status} in ${latency}ms)`,
        });
        return;
      }
      setTestingStatus({
        testing: false,
        success: false,
        message: msg,
      });
    }
  };

  const handleSave = async () => {
    const trimmed = baseUrl.trim();
    updateConfig({
      useMockApi: useMock,
      apiBaseUrl: trimmed,
    });
    await storage.setApiBaseUrl(trimmed);
    await storage.setUseMockApi(useMock);

    // Refresh store to load data from live backend or mock
    refreshAll().catch(() => {});
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.xl,
              padding: spacing.xl,
              ...shadows.soft,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
              <Icon name="settings" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>Backend Integration</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Configure REST API server and environment
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Mode Switcher */}
          <View
            style={[
              styles.modeBox,
              {
                backgroundColor: colors.surfaceVariant,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginTop: 16,
              },
            ]}
          >
            <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 8 }]}>
              DATA SOURCE MODE
            </Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setUseMock(true)}
                style={[
                  styles.toggleBtn,
                  {
                    backgroundColor: useMock ? colors.primary : colors.surface,
                    borderRadius: borderRadius.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.bodySmall,
                    { color: useMock ? '#FFFFFF' : colors.textPrimary, fontWeight: '700' },
                  ]}
                >
                  Mock Adapter
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setUseMock(false)}
                style={[
                  styles.toggleBtn,
                  {
                    backgroundColor: !useMock ? colors.primary : colors.surface,
                    borderRadius: borderRadius.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.bodySmall,
                    { color: !useMock ? '#FFFFFF' : colors.textPrimary, fontWeight: '700' },
                  ]}
                >
                  Live Backend (REST)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Base URL Input */}
          <Text style={[typography.titleMedium, { color: colors.textPrimary, marginTop: 16 }]}>
            API Base URL
          </Text>
          <TextInput
            value={baseUrl}
            onChangeText={setBaseUrl}
            placeholder="http://10.0.2.2:3000/api/v1"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceVariant,
                color: colors.textPrimary,
                borderRadius: borderRadius.md,
                borderColor: colors.borderSubtle,
                marginTop: 8,
              },
            ]}
          />

          {/* Quick Preset Chips */}
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 8 }]}>
            Quick Presets:
          </Text>
          <View style={styles.chipsRow}>
            <TouchableOpacity
              onPress={() => setBaseUrl(DEFAULT_DEV_API_URLS.androidEmulator)}
              style={[styles.chip, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.full }]}
            >
              <Text style={[typography.caption, { color: colors.textPrimary }]}>Android (10.0.2.2)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setBaseUrl(DEFAULT_DEV_API_URLS.iosSimulator)}
              style={[styles.chip, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.full }]}
            >
              <Text style={[typography.caption, { color: colors.textPrimary }]}>iOS (localhost)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setBaseUrl(DEFAULT_DEV_API_URLS.production)}
              style={[styles.chip, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.full }]}
            >
              <Text style={[typography.caption, { color: colors.textPrimary }]}>Production</Text>
            </TouchableOpacity>
          </View>

          {/* Test Status feedback */}
          {testingStatus.message ? (
            <View
              style={[
                styles.statusBanner,
                {
                  backgroundColor: testingStatus.success ? colors.successLight : colors.dangerLight,
                  borderRadius: borderRadius.md,
                  marginTop: 12,
                },
              ]}
            >
              <Icon
                name={testingStatus.success ? 'check' : 'alert'}
                size={16}
                color={testingStatus.success ? colors.success : colors.danger}
              />
              <Text
                style={[
                  typography.caption,
                  {
                    color: testingStatus.success ? colors.success : colors.danger,
                    marginLeft: 8,
                    flex: 1,
                    fontWeight: '600',
                  },
                ]}
              >
                {testingStatus.message}
              </Text>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={testConnection}
              disabled={testingStatus.testing}
              style={[
                styles.testBtn,
                {
                  borderColor: colors.borderSubtle,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              {testingStatus.testing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[typography.bodySmall, { color: colors.textPrimary, fontWeight: '600' }]}>Test Ping</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              style={[
                styles.saveBtn,
                {
                  backgroundColor: colors.primary,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <Text style={[typography.bodySmall, { color: '#FFFFFF', fontWeight: '700' }]}>
                Apply & Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  testBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
