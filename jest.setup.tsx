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
