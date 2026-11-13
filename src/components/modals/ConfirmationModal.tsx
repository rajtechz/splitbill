import React from 'react';
import { CustomAlertModal } from './CustomAlertModal';

export interface ConfirmationModalProps {
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
  return (
    <CustomAlertModal
      visible={visible}
      title={title}
      message={message}
      variant={isDestructive ? 'danger' : 'confirm'}
      confirmText={confirmText}
      cancelText={cancelText}
      isDestructive={isDestructive}
      onConfirm={onConfirm}
      onCancel={onCancel}
      onClose={onCancel}
    />
  );
};
