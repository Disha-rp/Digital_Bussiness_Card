/**
 * Application Root Component (Phase 2 Architecture)
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppStoreProvider } from './src/store';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppStoreProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </AppStoreProvider>
    </SafeAreaProvider>
  );
}
