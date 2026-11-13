import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  CustomAlertModal,
  CustomAlertModalProps,
  AlertVariant,
  AlertButton,
} from '../components/modals/CustomAlertModal';

export interface ShowAlertOptions {
  title: string;
  message?: string;
  variant?: AlertVariant;
  buttons?: AlertButton[];
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  isDestructive?: boolean;
  dismissable?: boolean;
  emoji?: string;
}

interface AlertContextType {
  showAlert: (options: ShowAlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

// Global ref so services outside React component tree can also trigger alerts!
let globalAlertHandler: ((options: ShowAlertOptions) => void) | null = null;

export const triggerGlobalAlert = (options: ShowAlertOptions) => {
  if (globalAlertHandler) {
    globalAlertHandler(options);
  } else {
    console.warn('AlertProvider is not mounted yet');
  }
};

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalProps, setModalProps] = useState<CustomAlertModalProps | null>(null);

  const hideAlert = useCallback(() => {
    setModalProps(prev => (prev ? { ...prev, visible: false } : null));
  }, []);

  const showAlert = useCallback(
    (options: ShowAlertOptions) => {
      // Auto detect celebration variant if title has 🎉 or emoji
      let detectedVariant = options.variant || 'info';
      if (!options.variant && (options.title.includes('🎉') || options.title.toLowerCase().includes('welcome') || options.title.toLowerCase().includes('pro'))) {
        detectedVariant = 'celebration';
      } else if (!options.variant && (options.title.toLowerCase().includes('error') || options.title.toLowerCase().includes('fail'))) {
        detectedVariant = 'danger';
      } else if (!options.variant && (options.title.toLowerCase().includes('success') || options.title.toLowerCase().includes('saved') || options.title.toLowerCase().includes('done'))) {
        detectedVariant = 'success';
      }

      setModalProps({
        visible: true,
        title: options.title,
        message: options.message,
        variant: detectedVariant,
        buttons: options.buttons,
        confirmText: options.confirmText,
        cancelText: options.cancelText,
        onConfirm: options.onConfirm,
        onCancel: options.onCancel,
        isDestructive: options.isDestructive,
        dismissable: options.dismissable ?? true,
        emoji: options.emoji,
        onClose: hideAlert,
      });
    },
    [hideAlert]
  );

  // Wire up global handler
  globalAlertHandler = showAlert;

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {modalProps && <CustomAlertModal {...modalProps} onClose={hideAlert} />}
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

