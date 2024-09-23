import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TelaInicial from './Telas/TelaInicial';
import TelaAgendamentos from './Telas/TelaAgendamento';

const Stack = createStackNavigator();

export default function App() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const loadAppointments = async () => {
      const storedAppointments = await AsyncStorage.getItem('@appointments');
      if (storedAppointments) {
        setAppointments(JSON.parse(storedAppointments));
      }
    };
    loadAppointments();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#151515',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          options={{ title: 'IFGENDER' }}
        >
          {props => <TelaInicial {...props} appointments={appointments} setAppointments={setAppointments} />}
        </Stack.Screen>
        <Stack.Screen
          name="AGENDAMENTO"
        >
          {props => <TelaAgendamentos {...props} appointments={appointments} setAppointments={setAppointments} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}