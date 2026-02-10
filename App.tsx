import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/hooks/useAuth';
import { MessageProvider } from './src/hooks/useMessages';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MessageProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </MessageProvider>
    </AuthProvider>
  );
};

export default App;
