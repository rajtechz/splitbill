/* eslint-disable no-undef */

const memoryStore = new Map();
const mockStorage = {
  getItem: jest.fn(key => Promise.resolve(memoryStore.has(key) ? memoryStore.get(key) : null)),
  setItem: jest.fn((key, value) => {
    memoryStore.set(key, String(value));
    return Promise.resolve(null);
  }),
  removeItem: jest.fn(key => {
    memoryStore.delete(key);
    return Promise.resolve(null);
  }),
  clear: jest.fn(() => {
    memoryStore.clear();
    return Promise.resolve(null);
  }),
  getAllKeys: jest.fn(() => Promise.resolve(Array.from(memoryStore.keys()))),
};

jest.mock('@react-native-async-storage/async-storage', () => mockStorage);

jest.mock('react-native-safe-area-context', () => {
  const mock = require('react-native-safe-area-context/jest/mock');
  return mock.default || mock;
});

jest.mock('react-native-screens', () => {
  const React = require('react');
  const View = require('react-native').View;
  return {
    enableScreens: jest.fn(),
    screensEnabled: jest.fn(() => true),
    ScreenContainer: View,
    Screen: View,
    NativeScreen: View,
    NativeScreenContainer: View,
    ScreenStack: View,
    ScreenStackItem: View,
    ScreenStackHeaderConfig: View,
    ScreenStackHeaderBackButtonImage: View,
    ScreenStackHeaderCenterView: View,
    ScreenStackHeaderLeftView: View,
    ScreenStackHeaderRightView: View,
    ScreenStackHeaderSearchBarView: View,
    ScreenFooter: View,
    SearchBar: View,
    compatibilityFlags: {},
    isSearchBarAvailableForCurrentPlatform: () => false,
  };
});
