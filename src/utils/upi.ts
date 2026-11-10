import { Linking, Alert } from 'react-native';

export interface UpiPaymentParams {
  payeeUpiId: string;
  payeeName: string;
  amount: number;
  note?: string;
  transactionRef?: string;
}

/**
 * Builds standard NPCI-compliant UPI payment URL
 * Supported natively by Google Pay, PhonePe, Paytm, BHIM, CRED, Amazon Pay, etc.
 */
export const buildUpiUrl = ({
  payeeUpiId,
  payeeName,
  amount,
  note = 'SplitMate Settlement',
  transactionRef,
}: UpiPaymentParams): string => {
  const cleanUpi = payeeUpiId.trim();
  const cleanName = encodeURIComponent(payeeName.trim());
  const cleanNote = encodeURIComponent(note.trim());
  const formattedAmount = amount.toFixed(2);
  const ref = transactionRef || `SM${Date.now().toString().slice(-8)}`;

  return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${formattedAmount}&cu=INR&tn=${cleanNote}&tr=${ref}`;
};

/**
 * Launches the native UPI intent to complete real bank-to-bank transfer
 */
export const initiateUpiTransfer = async (params: UpiPaymentParams): Promise<boolean> => {
  if (!params.payeeUpiId || !params.payeeUpiId.includes('@')) {
    Alert.alert('Invalid UPI ID', 'The receiver does not have a valid UPI ID (e.g. name@okaxis, phone@upi).');
    return false;
  }

  const upiUrl = buildUpiUrl(params);

  try {
    const supported = await Linking.canOpenURL(upiUrl);
    if (supported) {
      await Linking.openURL(upiUrl);
      return true;
    } else {
      // In simulator or environments without direct UPI apps installed
      Alert.alert(
        'UPI App Not Found',
        `No native UPI application (PhonePe, Google Pay, Paytm) was detected on this device/simulator.\n\nSimulated UPI Intent:\n${upiUrl}\n\nPlease transfer ₹${params.amount.toFixed(
          2
        )} to ${params.payeeUpiId} and record the transaction reference here.`,
        [{ text: 'OK' }]
      );
      return false;
    }
  } catch {
    Alert.alert(
      'Manual Payment Required',
      `Please open your banking app and transfer ₹${params.amount.toFixed(2)} to ${params.payeeUpiId}.`
    );
    return false;
  }
};

