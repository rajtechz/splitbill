import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { CurrencyCode } from '../../types';

export interface LocationDetectionResult {
  countryCode: string;
  countryName: string;
  suggestedCurrency: CurrencyCode;
  currencySymbol: string;
}

// Country code to default currency mapping
const COUNTRY_CURRENCY_MAP: Record<string, { currency: CurrencyCode; name: string; symbol: string }> = {
  IN: { currency: 'INR', name: 'India', symbol: '₹' },
  US: { currency: 'USD', name: 'United States', symbol: '$' },
  GB: { currency: 'GBP', name: 'United Kingdom', symbol: '£' },
  DE: { currency: 'EUR', name: 'Germany', symbol: '€' },
  FR: { currency: 'EUR', name: 'France', symbol: '€' },
  IT: { currency: 'EUR', name: 'Italy', symbol: '€' },
  ES: { currency: 'EUR', name: 'Spain', symbol: '€' },
  NL: { currency: 'EUR', name: 'Netherlands', symbol: '€' },
  AU: { currency: 'AUD', name: 'Australia', symbol: 'A$' },
  CA: { currency: 'CAD', name: 'Canada', symbol: 'C$' },
  AE: { currency: 'AED', name: 'United Arab Emirates', symbol: 'AED' },
  JP: { currency: 'JPY', name: 'Japan', symbol: '¥' },
  SG: { currency: 'SGD', name: 'Singapore', symbol: 'S$' },
};

// Timezone to Country code mapping fallback
const TIMEZONE_COUNTRY_MAP: Record<string, string> = {
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'Europe/London': 'GB',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE',
  'Europe/Rome': 'IT',
  'Europe/Madrid': 'ES',
  'Europe/Amsterdam': 'NL',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'Asia/Dubai': 'AE',
  'Asia/Tokyo': 'JP',
  'Asia/Singapore': 'SG',
};

export class LocationService {
  /**
   * Request location permission on device
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'SplitMate needs access to your location to automatically set your default local currency.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch {
        return false;
      }
    }
    // On iOS, system automatically prompts when location APIs are accessed with Info.plist description
    return true;
  }

  /**
   * Detect user's country and suggest optimal default currency
   */
  async detectCountryAndCurrency(): Promise<LocationDetectionResult> {
    // 1. Request native permission
    await this.requestPermission();

    // 2. Resolve country via device timezone & locale
    let countryCode = 'IN'; // Default

    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timeZone && TIMEZONE_COUNTRY_MAP[timeZone]) {
        countryCode = TIMEZONE_COUNTRY_MAP[timeZone];
      } else if (timeZone?.startsWith('Asia/Kolkata') || timeZone?.startsWith('Asia/Calcutta')) {
        countryCode = 'IN';
      } else if (timeZone?.startsWith('America/')) {
        countryCode = 'US';
      } else if (timeZone?.startsWith('Europe/')) {
        countryCode = 'EUR' in COUNTRY_CURRENCY_MAP ? 'FR' : 'GB';
      } else if (timeZone?.startsWith('Australia/')) {
        countryCode = 'AU';
      }
    } catch {
      countryCode = 'IN';
    }

    const info = COUNTRY_CURRENCY_MAP[countryCode] || COUNTRY_CURRENCY_MAP.IN;

    return {
      countryCode,
      countryName: info.name,
      suggestedCurrency: info.currency,
      currencySymbol: info.symbol,
    };
  }
}

export const locationService = new LocationService();

