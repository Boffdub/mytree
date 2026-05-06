module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/docs/',
    '/ios/',
    '/android/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent|-[\\w-]+)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-url-polyfill|@supabase/.*|@react-native-async-storage/.*)/)',
  ],
  setupFiles: ['./jest.setup.js'],
};
