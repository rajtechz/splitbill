import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { Button } from '../buttons/Button';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  const { colors, typography, spacing, borderRadius } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onCancel}
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.xl,
              padding: spacing.xl,
            },
          ]}
        >
          <Text style={[typography.h3, { color: colors.textPrimary }]}>{title}</Text>
          <Text
            style={[
              typography.bodyMedium,
              { color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
            ]}
          >
            {message}
          </Text>

          <View style={styles.actions}>
            <Button
              title={cancelText}
              variant="outline"
              onPress={onCancel}
              style={{ flex: 1, marginRight: spacing.sm }}
            />
            <Button
              title={confirmText}
              variant={isDestructive ? 'danger' : 'primary'}
              onPress={onConfirm}
              style={{ flex: 1, marginLeft: spacing.sm }}
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
  },
  actions: {
    flexDirection: 'row',
  },
});

