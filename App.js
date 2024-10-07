<<<<<<< HEAD
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
=======
import React, { useContext, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Image, View, Text, TouchableOpacity, StyleSheet, Animated, StatusBar } from 'react-native';
import TelaInicial from './Telas/TelaInicial';
import TelaAgendamentos from './Telas/TelaAgendamento';
import { getAppointments } from './database';
import { ThemeProvider, ThemeContext } from './Telas/tema';

const Stack = createStackNavigator();

function ToggleButton() {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [animation] = useState(new Animated.Value(isDarkMode ? 1 : 0));

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isDarkMode ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isDarkMode]);

  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  const backgroundColor = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E5E5E5', '#4D4D4D'],
  });

  return (
    <TouchableOpacity onPress={toggleTheme} style={styles.toggleWrapper}>
      <Text style={styles.iconText}>{isDarkMode ? '🌙' : '🌞'}</Text>
      <Animated.View style={[styles.toggleContainer, { backgroundColor }]}>
        <Animated.View style={[styles.toggleBall, { transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

function LogoTitle() {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.logoTitleContainer}>
        <Image
          source={require('./assets/icon.png')}
          style={styles.logo}
        />
        <Text style={styles.logoText}>IFPLANNER</Text>
      </View>
      <ToggleButton />
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
    </View>
  );
}

<<<<<<< HEAD
export default function App() {
=======
function AppNavigator() {
  const { theme, isDarkMode } = useContext(ThemeContext);
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const loadAppointments = async () => {
      const storedAppointments = await getAppointments();
      setAppointments(storedAppointments);
    };
    loadAppointments();
  }, []);

<<<<<<< HEAD
=======
  useEffect(() => {
    StatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content');
    StatusBar.setBackgroundColor(theme.headerBackground);
  }, [isDarkMode, theme.headerBackground]);

>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
<<<<<<< HEAD
            backgroundColor: '#151515',
          },
          headerTintColor: '#FFFFFF',
=======
            backgroundColor: theme.headerBackground,
          },
          headerTintColor: theme.headerText,
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
        }}
      >
        <Stack.Screen
          name="Home"
          options={{ headerTitle: () => <LogoTitle /> }}
        >
<<<<<<< HEAD
          {props => <TelaInicial {...props} appointments={appointments} setAppointments={setAppointments} />}
        </Stack.Screen>
        <Stack.Screen
          name="AGENDAMENTO"
        >
          {props => <TelaAgendamentos {...props} appointments={appointments} setAppointments={setAppointments} />}
=======
          {props => (
            <TelaInicial {...props} appointments={appointments} setAppointments={setAppointments} />
          )}
        </Stack.Screen>
        <Stack.Screen
          name="AGENDAMENTO"
          options={{
            headerTitle: () => (
              <Text style={[styles.logoText, { color: '#9282FA', fontWeight: 'bold' }]}>AGENDAMENTO</Text>
            ),
            headerStyle: {
              backgroundColor: theme.headerBackground, // Usa a cor do fundo do tema
            },
            headerTintColor: theme.headerText, // Cor do texto no cabeçalho
          }}
        >
          {props => (
            <TelaAgendamentos {...props} appointments={appointments} setAppointments={setAppointments} />
          )}
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
<<<<<<< HEAD
}
=======
}

export default function App() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  logoTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 70,
    height: 70,
    marginRight: -10,
    marginLeft: -20,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9282FA',
  },
  toggleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 18,
    marginRight: 10,
  },
  toggleContainer: {
    width: 40,
    height: 20,
    borderRadius: 25,
    padding: 2,
    justifyContent: 'center',
  },
  toggleBall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
});
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
