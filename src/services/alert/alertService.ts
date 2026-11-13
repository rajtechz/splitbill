import { triggerGlobalAlert, ShowAlertOptions } from '../../context/AlertContext';
import { AlertButton, AlertVariant } from '../../components/modals/CustomAlertModal';

/**
 * Global Drop-in Alert Service
 * Can be called anywhere (inside components, hooks, or outside React tree like API handlers)
 * e.g. customAlert('Welcome to Pro!', 'Your subscription is now active.', [{ text: 'Great!' }])
 */
export const customAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
  variant?: AlertVariant
) => {
  triggerGlobalAlert({
    title,
    message,
    buttons,
    variant,
  });
};

export const alertService = {
  show: (options: ShowAlertOptions) => triggerGlobalAlert(options),
  alert: customAlert,
  success: (title: string, message?: string, onConfirm?: () => void) => {
    triggerGlobalAlert({
      title,
      message,
      variant: 'success',
      confirmText: 'Done',
      onConfirm,
    });
  },
  error: (title: string, message?: string, onConfirm?: () => void) => {
    triggerGlobalAlert({
      title,
      message,
      variant: 'danger',
      confirmText: 'OK',
      onConfirm,
    });
  },
  confirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    isDestructive: boolean = false
  ) => {
    triggerGlobalAlert({
      title,
      message,
      variant: isDestructive ? 'danger' : 'confirm',
      confirmText: isDestructive ? 'Delete' : 'Confirm',
      cancelText: 'Cancel',
      isDestructive,
      onConfirm,
      onCancel,
    });
  },
};

