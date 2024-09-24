import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Image, View, Text } from 'react-native';
import TelaInicial from './Telas/TelaInicial';
import TelaAgendamentos from './Telas/TelaAgendamento';
import { getAppointments } from './database';

const Stack = createStackNavigator();

function LogoTitle() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: -40 }}>
      <Image
        source={require('./assets/icon.png')}
        style={{ width: 100, height: 100, marginRight: -20 }}
      />
      <Text style={{ color: '#9282FA', fontWeight: 'bold', fontSize: 20 }}>IFPLANNER</Text>
    </View>
  );
}

export default function App() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const loadAppointments = async () => {
      const storedAppointments = await getAppointments();
      setAppointments(storedAppointments);
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
        }}
      >
        <Stack.Screen
          name="Home"
          options={{ headerTitle: () => <LogoTitle /> }}
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