import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RegistroVisitaScreen from './src/screens/RegistroVisitaScreen';
import HistoricoScreen from './src/screens/HistoricoScreen';
import { cores } from './src/styles/globalStyles';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Registro"
          screenOptions={{
            headerStyle: { backgroundColor: cores.primariaEscura },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: cores.fundo },
          }}
        >
          <Stack.Screen
            name="Registro"
            component={RegistroVisitaScreen}
            options={{ title: 'Visita técnica' }}
          />
          <Stack.Screen
            name="Historico"
            component={HistoricoScreen}
            options={{ title: 'Histórico local' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
