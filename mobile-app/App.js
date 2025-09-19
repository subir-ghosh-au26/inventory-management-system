import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider, ActivityIndicator, Button } from 'react-native-paper';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Toast from 'react-native-toast-message';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ScannerScreen from './screens/ScannerScreen';
import FormScreen from './screens/FormScreen';
import HistoryScreen from './screens/HistoryScreen';

const Stack = createNativeStackNavigator();

// This is the stack of screens for a logged-in user
function AppStack() {
  const { logout } = useContext(AuthContext);
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Inventory Actions',
          headerRight: () => <Button onPress={() => logout()}>Logout</Button>
        }}
      />
      <Stack.Screen name="Scanner" component={ScannerScreen} options={{ title: 'Scan QR Code' }} />
      <Stack.Screen name="Form" component={FormScreen} />
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: 'My History' }}
      />
    </Stack.Navigator>
  );
}

// This is the stack for a logged-out user (just the login screen)
function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { userToken, isLoading } = useContext(AuthContext);

  if (isLoading) {
    // checking for a token
    return <ActivityIndicator style={{ flex: 1 }} animating={true} size="large" />;
  }

  return (
    <NavigationContainer>
      {userToken ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PaperProvider>
        <AppNavigator />
        <Toast />
      </PaperProvider>
    </AuthProvider>
  );
}