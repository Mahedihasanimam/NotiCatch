import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { useSettings } from '@/store/settings';

// Platform-specific API keys from RevenueCat dashboard
export const REVENUECAT_API_KEY = 'goog_WEUfiWEEiTZXBgtbESWuIANGlCV';

// Fallback test key for simulator / environments without Google Play Billing
export const REVENUECAT_TEST_KEY = 'test_YxbvPPIVZgfpXGBTqPtGdgqNISN';

// Entitlement identifier configured in RevenueCat dashboard
export const ENTITLEMENT_ID = 'noticatch_pro';

// Product identifier on Google Play Store / RevenueCat
export const PRODUCT_ID = 'noticatch_monthly';

let initialized = false;
let lastOfferingsError: string | null = null;

/**
 * Returns the last error encountered when attempting to fetch offerings from RevenueCat / Google Play.
 */
export function getLastOfferingsError(): string | null {
  return lastOfferingsError;
}

/**
 * Parses RevenueCat / Google Play errors into user-friendly messages and flags.
 */
export function parsePurchasesError(error: any): {
  cancelled: boolean;
  userMessage: string;
  code?: string;
} {
  if (!error) {
    return { cancelled: false, userMessage: 'An unexpected purchase error occurred.' };
  }

  // 1. User voluntarily cancelled the billing sheet
  if (
    error.userCancelled ||
    error.code === PURCHASES_ERROR_CODE?.PURCHASE_CANCELLED_ERROR ||
    error.code === '1'
  ) {
    return { cancelled: true, userMessage: 'Purchase was cancelled.' };
  }

  const rawMsg = String(error.message || error.underlyingErrorMessage || error);

  // 2. Billing Unavailable on Device (No Google Play account, emulator without Play Store, outdated Play Services)
  if (
    error.code === PURCHASES_ERROR_CODE?.PURCHASE_NOT_ALLOWED_ERROR ||
    error.code === '3' ||
    rawMsg.includes('BILLING_UNAVAILABLE') ||
    rawMsg.includes('Billing service unavailable')
  ) {
    return {
      cancelled: false,
      code: 'BILLING_UNAVAILABLE',
      userMessage:
        'Google Play Store billing is unavailable on this device. Please make sure Google Play Store is installed, updated, and signed into a Google account.',
    };
  }

  // 3. Network connection issues
  if (
    error.code === PURCHASES_ERROR_CODE?.NETWORK_ERROR ||
    error.code === PURCHASES_ERROR_CODE?.OFFLINE_CONNECTION_ERROR ||
    error.code === '10' ||
    error.code === '35' ||
    rawMsg.toLowerCase().includes('network') ||
    rawMsg.toLowerCase().includes('offline')
  ) {
    return {
      cancelled: false,
      code: 'NETWORK_ERROR',
      userMessage: 'Network connection issue. Please check your internet connection and try again.',
    };
  }

  // 4. Product already purchased (user already has VIP subscription)
  if (
    error.code === PURCHASES_ERROR_CODE?.PRODUCT_ALREADY_PURCHASED_ERROR ||
    error.code === '6' ||
    rawMsg.toLowerCase().includes('already purchased')
  ) {
    useSettings.getState().setPro(true);
    return {
      cancelled: false,
      code: 'ALREADY_PURCHASED',
      userMessage: 'You already own this subscription! VIP access has been restored.',
    };
  }

  // 5. Payment pending approval
  if (error.code === PURCHASES_ERROR_CODE?.PAYMENT_PENDING_ERROR || error.code === '20') {
    return {
      cancelled: false,
      code: 'PAYMENT_PENDING',
      userMessage: 'Payment is pending approval. Your VIP pass will activate once Google confirms payment.',
    };
  }

  // 6. Google Play Store temporary problem
  if (error.code === PURCHASES_ERROR_CODE?.STORE_PROBLEM_ERROR || error.code === '2') {
    return {
      cancelled: false,
      code: 'STORE_PROBLEM',
      userMessage: 'Google Play Store encountered a temporary issue. Please try again shortly.',
    };
  }

  // 7. Product unavailable or configuration issue
  if (
    error.code === PURCHASES_ERROR_CODE?.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR ||
    error.code === PURCHASES_ERROR_CODE?.CONFIGURATION_ERROR ||
    error.code === '5' ||
    error.code === '23'
  ) {
    return {
      cancelled: false,
      code: 'PRODUCT_UNAVAILABLE',
      userMessage: 'Subscription package is currently being prepared on Google Play. Please try again in a few moments.',
    };
  }

  // Fallback user message
  return {
    cancelled: false,
    userMessage: error.message || 'Purchase could not be completed at this time.',
  };
}

/**
 * Initializes the RevenueCat SDK with the platform-appropriate API key.
 * Also registers customer info listener to automatically grant or revoke VIP access.
 */
export function initPurchases(): void {
  if (initialized) return;

  try {
    // Custom log handler to catch BILLING_UNAVAILABLE and log a clear warning rather than an unhandled error trace
    Purchases.setLogHandler((logLevel, message) => {
      if (message.includes('BILLING_UNAVAILABLE') || message.includes('Billing service unavailable')) {
        if (__DEV__) {
          console.warn(
            '[RevenueCat Notice] Google Play Billing service is unavailable on this device/environment. (Ensure device has Google Play Store signed in, or use RevenueCat test_ key for offline development).'
          );
        }
        return;
      }

      if (logLevel === LOG_LEVEL.ERROR) {
        console.warn('[RevenueCat Error]', message);
      } else if (__DEV__) {
        console.log('[RevenueCat]', message);
      }
    });

    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    } else {
      Purchases.setLogLevel(LOG_LEVEL.INFO);
    }

    // Configure RevenueCat SDK
    Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    initialized = true;

    // Listen for real-time subscription status changes (renewals, cancellations, expirations)
    Purchases.addCustomerInfoUpdateListener((customerInfo: CustomerInfo) => {
      handleCustomerInfo(customerInfo);
    });

    // Check existing subscription status on launch
    void Purchases.getCustomerInfo()
      .then(handleCustomerInfo)
      .catch((err) => {
        if (__DEV__) {
          console.log('[Purchases] Initial getCustomerInfo note:', err?.message || err);
        }
      });
  } catch (e) {
    console.warn('[Purchases] Failed to initialize RevenueCat:', e);
  }
}

/**
 * Checks whether the user has active entitlement for noticatch_pro.
 */
export function isProActive(customerInfo: CustomerInfo): boolean {
  const hasEntitlement = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  const hasActiveSub = customerInfo.activeSubscriptions.length > 0;
  return hasEntitlement || hasActiveSub;
}

/**
 * Updates in-app Pro/VIP state based on active entitlements or subscriptions.
 * Accurately locks or unlocks features when subscription renews, expires, or cancels.
 */
export function handleCustomerInfo(customerInfo: CustomerInfo): void {
  const hasActive = isProActive(customerInfo);
  useSettings.getState().setPro(hasActive);
}

/**
 * Fetches the latest customer info from RevenueCat.
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    initPurchases();
    const customerInfo = await Purchases.getCustomerInfo();
    handleCustomerInfo(customerInfo);
    return customerInfo;
  } catch (e) {
    if (__DEV__) {
      console.log('[Purchases] getCustomerInfo note:', e);
    }
    return null;
  }
}

/**
 * Fetches the active offering from RevenueCat.
 * Returns the monthly package (or first available package) with localized pricing.
 */
export async function getSubscriptionPackage(): Promise<PurchasesPackage | null> {
  try {
    initPurchases();
    lastOfferingsError = null;
    const offerings = await Purchases.getOfferings();
    if (offerings.current && offerings.current.availablePackages.length > 0) {
      return offerings.current.monthly ?? offerings.current.availablePackages[0] ?? null;
    }
    lastOfferingsError = 'No subscription packages configured in RevenueCat default offering.';
    return null;
  } catch (e: any) {
    const parsed = parsePurchasesError(e);
    lastOfferingsError = parsed.userMessage;
    if (__DEV__) {
      console.log('[Purchases] Offerings fetch note:', parsed.userMessage);
    }
    return null;
  }
}

/**
 * Launches Google Play Billing sheet for the subscription package.
 */
export async function purchaseSubscription(
  pkg?: PurchasesPackage | null
): Promise<{ success: boolean; cancelled?: boolean; error?: string }> {
  try {
    initPurchases();

    // If a specific package is provided, purchase it directly
    if (pkg) {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      handleCustomerInfo(customerInfo);
      return { success: true };
    }

    // Otherwise, fetch the active package first
    const activePkg = await getSubscriptionPackage();
    if (activePkg) {
      const { customerInfo } = await Purchases.purchasePackage(activePkg);
      handleCustomerInfo(customerInfo);
      return { success: true };
    }

    return {
      success: false,
      error:
        lastOfferingsError ||
        'Google Play Store billing is unavailable on this device. Please make sure Google Play Store is installed, updated, and signed into a Google account.',
    };
  } catch (e: any) {
    const parsed = parsePurchasesError(e);
    if (parsed.cancelled) {
      return { success: false, cancelled: true };
    }
    return { success: false, error: parsed.userMessage };
  }
}

/**
 * Restores previous purchases for users who reinstalled the app or switched devices.
 */
export async function restoreSubscription(): Promise<{ restored: boolean; message: string }> {
  try {
    initPurchases();
    const customerInfo = await Purchases.restorePurchases();
    const hasActive = isProActive(customerInfo);
    useSettings.getState().setPro(hasActive);

    if (hasActive) {
      return { restored: true, message: '🎉 Your VIP Pass was successfully restored!' };
    } else {
      return { restored: false, message: 'No active VIP subscription found for this Google account.' };
    }
  } catch (e: any) {
    const parsed = parsePurchasesError(e);
    return { restored: false, message: parsed.userMessage };
  }
}

/**
 * Presents the RevenueCat Paywall modally.
 * Configured in RevenueCat Dashboard -> Paywalls.
 */
export async function presentRevenueCatPaywall(): Promise<PAYWALL_RESULT> {
  try {
    initPurchases();
    const result = await RevenueCatUI.presentPaywall();
    if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
      useSettings.getState().setPro(true);
    }
    return result;
  } catch (e) {
    console.warn('[Purchases] presentRevenueCatPaywall error:', e);
    return PAYWALL_RESULT.ERROR;
  }
}

/**
 * Presents the RevenueCat Paywall only if the user does NOT have active 'noticatch_pro' entitlement.
 */
export async function presentPaywallIfNeeded(): Promise<PAYWALL_RESULT> {
  try {
    initPurchases();
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: ENTITLEMENT_ID,
    });
    if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
      useSettings.getState().setPro(true);
    }
    return result;
  } catch (e) {
    console.warn('[Purchases] presentPaywallIfNeeded error:', e);
    return PAYWALL_RESULT.ERROR;
  }
}

/**
 * Presents the RevenueCat Customer Center to manage, review, or cancel subscriptions.
 */
export async function presentCustomerCenter(): Promise<void> {
  try {
    initPurchases();
    await RevenueCatUI.presentCustomerCenter();
  } catch (e) {
    console.warn('[Purchases] presentCustomerCenter error:', e);
  }
}

export { PAYWALL_RESULT };
