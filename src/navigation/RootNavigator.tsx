/**
 * Root Application Navigator
 * Implements the protected navigation flow:
 * Login -> My Cards -> Create Card -> Choose Template -> Edit Card -> Preview -> Share
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../store/authStore';

// Screens
import { LoginScreen } from '../screens/LoginScreen';
import { MyCardsScreen } from '../screens/MyCardsScreen';
import { CreateCardScreen } from '../screens/CreateCardScreen';
import { TemplateSelectionScreen } from '../screens/TemplateSelectionScreen';
import { EditCardScreen } from '../screens/EditCardScreen';
import { PreviewScreen } from '../screens/PreviewScreen';
import { ShareScreen } from '../screens/ShareScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#090D16' },
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          // Protected App Flow Stack
          <Stack.Group>
            <Stack.Screen name="MyCards" component={MyCardsScreen} />
            <Stack.Screen name="CreateCard" component={CreateCardScreen} />
            <Stack.Screen name="TemplateSelection" component={TemplateSelectionScreen} />
            <Stack.Screen name="EditCard" component={EditCardScreen} />
            <Stack.Screen name="Preview" component={PreviewScreen} />
            <Stack.Screen name="Share" component={ShareScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
