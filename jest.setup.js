// Global test setup for Jest
global.__DEV__ = true;

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
  getStringAsync: jest.fn().mockResolvedValue('https://qrtrac.link/1E37'),
  hasStringAsync: jest.fn().mockResolvedValue(true),
  getUrlAsync: jest.fn().mockResolvedValue('https://qrtrac.link/1E37'),
  setUrlAsync: jest.fn().mockResolvedValue(undefined),
  hasUrlAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn().mockResolvedValue('file:///data/user/0/com.app/cache/Disha_Patil_card_captured.png'),
  captureScreen: jest.fn().mockResolvedValue('file:///data/user/0/com.app/cache/screen_capture.png'),
}));
