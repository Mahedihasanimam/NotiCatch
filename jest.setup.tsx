// Global test setup. Native modules are mocked per-test where needed.
jest.mock('expo-sqlite/kv-store', () => {
  const mem = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItemSync: (k: string) => mem.get(k) ?? null,
      setItemSync: (k: string, v: string) => void mem.set(k, v),
      removeItemSync: (k: string) => void mem.delete(k),
    },
  };
});

// Icon fonts are loaded through the asset pipeline, which does not exist under Jest.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Icon = ({ name }: { name: string }) => React.createElement(Text, null, name);
  return { __esModule: true, Ionicons: Icon };
});

// Mock RevenueCat react-native-purchases
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    setLogLevel: jest.fn(),
    setLogHandler: jest.fn(),
    getOfferings: jest.fn().mockResolvedValue({ current: null }),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn().mockResolvedValue({ entitlements: { active: {} }, activeSubscriptions: [] }),
    getCustomerInfo: jest.fn().mockResolvedValue({ entitlements: { active: {} }, activeSubscriptions: [] }),
    addCustomerInfoUpdateListener: jest.fn(),
  },
  LOG_LEVEL: {
    VERBOSE: 'VERBOSE',
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
  },
  PURCHASES_ERROR_CODE: {
    PURCHASE_CANCELLED_ERROR: '1',
    STORE_PROBLEM_ERROR: '2',
    PURCHASE_NOT_ALLOWED_ERROR: '3',
    PRODUCT_ALREADY_PURCHASED_ERROR: '6',
    NETWORK_ERROR: '10',
    OFFLINE_CONNECTION_ERROR: '35',
    PAYMENT_PENDING_ERROR: '20',
    CONFIGURATION_ERROR: '23',
    PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR: '5',
  },
}));

// Mock RevenueCat react-native-purchases-ui
jest.mock('react-native-purchases-ui', () => ({
  __esModule: true,
  default: {
    presentPaywall: jest.fn().mockResolvedValue('PURCHASED'),
    presentPaywallIfNeeded: jest.fn().mockResolvedValue('NOT_PRESENTED'),
    presentCustomerCenter: jest.fn().mockResolvedValue(undefined),
    PAYWALL_RESULT: {
      NOT_PRESENTED: 'NOT_PRESENTED',
      ERROR: 'ERROR',
      CANCELLED: 'CANCELLED',
      PURCHASED: 'PURCHASED',
      RESTORED: 'RESTORED',
    },
  },
  PAYWALL_RESULT: {
    NOT_PRESENTED: 'NOT_PRESENTED',
    ERROR: 'ERROR',
    CANCELLED: 'CANCELLED',
    PURCHASED: 'PURCHASED',
    RESTORED: 'RESTORED',
  },
}));
