// App.js
import React, { useContext, useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import TelaInicial from './Telas/TelaInicial';
import TelaAgendamentos from './Telas/TelaAgendamento';
import TelaServicos from './Telas/TelaServicos';
import TelaColaboradores from './Telas/TelaColaboradores';
import TelaGerenciar from './Telas/TelaGerenciar';
import TelaAtendimento from './Telas/TelaAtendimentos';
import TelaAtendimentosConcluidos from './Telas/TelaAtendimentosConcluidos';
import TelaEditarAtendimentoConcluido from './Telas/TelaEditarAtendimentoConcluido';
import EditAppointmentTextScreen from './Telas/EditarTextoAgendamento';
import WelcomeScreen from './Telas/TelaBemVindo';
import QuickTourScreen from './Telas/TelaIntroducao';
import InitialSetupScreen from './Telas/TelaInicializacao';
import SettingsScreen from './Telas/TelaConfiguracoes';
import TelaClientesAtendidos from './Telas/TelaClientesAtendidos'

import {
  createTablesIfNeeded,
  getAppointments,
  checkTablesExist,
  updateActivityFields,
} from './database';
import { ThemeProvider, ThemeContext } from './Telas/tema';

import Toast from 'react-native-toast-message';
import CustomToast from './CustomToast';

import * as FileSystem from 'expo-file-system';

if (!__DEV__) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}

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
        <Animated.View
          style={[styles.toggleBall, { transform: [{ translateX }] }]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

function LogoTitle({ businessName, logoUri }) {
  const displayName =
    businessName && businessName.length > 15
      ? businessName.substring(0, 15) + '...'
      : businessName || 'IFPLANNER';

  return (
    <View style={styles.headerContainer}>
      <View style={styles.logoTitleContainer}>
        {logoUri ? (
          <Image source={{ uri: logoUri }} style={styles.logo} />
        ) : (
          <Image source={require('./assets/icon.png')} style={styles.logo} />
        )}
        <Text style={styles.logoText}>{displayName}</Text>
      </View>
      <ToggleButton />
    </View>
  );
}

function AppNavigator({
  appointments,
  setAppointments,
  businessInfo,
  setBusinessInfo,
}) {
  const { theme, isDarkMode } = useContext(ThemeContext);

  useEffect(() => {
    StatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content');
  }, [isDarkMode]);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.headerBackground,
          },
          headerTintColor: theme.headerText,
        }}
      >
        {/* Telas de Primeira Inicialização */}
        {!businessInfo.isSetupComplete && (
          <>
            <Stack.Screen
              name="Welcome"
              component={WelcomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="QuickTour"
              component={QuickTourScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="InitialSetup"
              options={{ headerTitle: 'Configuração Inicial' }}
            >
              {(props) => (
                <InitialSetupScreen
                  {...props}
                  setBusinessInfo={setBusinessInfo}
                />
              )}
            </Stack.Screen>
          </>
        )}

        {/* Telas do Aplicativo */}
        {businessInfo.isSetupComplete && (
          <>
            <Stack.Screen
              name="Home"
              options={{
                headerTitle: () => (
                  <LogoTitle
                    businessName={businessInfo.name}
                    logoUri={businessInfo.logo}
                  />
                ),
              }}
            >
              {(props) => (
                <TelaInicial
                  {...props}
                  appointments={appointments}
                  setAppointments={setAppointments}
                  businessInfo={businessInfo}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="AGENDAMENTO"
              options={{
                headerTitle: 'Agendamento',
              }}
            >
              {(props) => (
                <TelaAgendamentos
                  {...props}
                  appointments={appointments}
                  setAppointments={setAppointments}
                  businessInfo={businessInfo}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="ATENDIMENTO"
              options={{
                headerTitle: 'Atendimento',
              }}
            >
              {(props) => (
                <TelaAtendimento
                  {...props}
                  appointments={appointments}
                  setAppointments={setAppointments}
                  businessInfo={businessInfo}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="GERENCIAR"
              component={TelaGerenciar}
              options={{
                headerTitle: 'Gerenciar',
              }}
            />
            <Stack.Screen
              name="SERVIÇOS"
              options={{
                headerTitle: 'Gerenciar Serviços',
              }}
            >
              {(props) => (
                <TelaServicos
                  {...props}
                  businessInfo={businessInfo}
                  setBusinessInfo={setBusinessInfo}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="COLABORADORES"
              component={TelaColaboradores}
              options={{
                headerTitle: 'Gerenciar Colaboradores',
              }}
            />
            <Stack.Screen
              name="ATENDIMENTOS_CONCLUIDOS"
              component={TelaAtendimentosConcluidos}
              options={{
                headerTitle: 'Atendimentos Concluídos',
              }}
            />
            <Stack.Screen
              name="EDITAR_ATENDIMENTO_CONCLUIDO"
              component={TelaEditarAtendimentoConcluido}
              options={{
                headerTitle: 'Editar Atendimento',
              }}
            />
            <Stack.Screen
              name="Settings"
              options={{ headerTitle: 'Configurações' }}
            >
              {(props) => (
                <SettingsScreen
                  {...props}
                  businessInfo={businessInfo}
                  setBusinessInfo={setBusinessInfo}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="EditAppointmentTextScreen"
              component={EditAppointmentTextScreen}
              options={{
                headerTitle: 'Editar Texto de Agendamento',
              }}
            />

<Stack.Screen
          name="CLIENTES_ATENDIDOS"
          component={TelaClientesAtendidos}
          options={{
            headerTitle: 'Clientes Atendidos',
          }}
        />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [businessInfo, setBusinessInfo] = useState({ isSetupComplete: false });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Inicialização do banco de dados
        await createTablesIfNeeded();
        await checkTablesExist();
        await updateActivityFields();
        
        const storedAppointments = await getAppointments();
        setAppointments(storedAppointments);

        // Verificar se é a primeira inicialização
        const setupData = await AsyncStorage.getItem('businessInfo');
        if (setupData) {
          setBusinessInfo(JSON.parse(setupData));
        }

        setIsDbReady(true);
      } catch (error) {
        console.error('Erro ao inicializar o aplicativo:', error);
      }
    };
    initializeApp();
  }, []);

  const handleSetAppointments = useCallback((newAppointments) => {
    setAppointments(newAppointments);
  }, []);

  const handleSetBusinessInfo = async (info) => {
    setBusinessInfo(info);
    await AsyncStorage.setItem('businessInfo', JSON.stringify(info));
  };

  if (!isDbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8A2BE2" />
        <Text>Inicializando o aplicativo...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AppNavigator
        appointments={appointments}
        setAppointments={handleSetAppointments}
        businessInfo={businessInfo}
        setBusinessInfo={handleSetBusinessInfo}
      />

      {/* Configuração do Toast com o CustomToast */}
      <Toast
        config={{
          success: (props) => <CustomToast {...props} />,
          error: (props) => <CustomToast {...props} />,
          info: (props) => <CustomToast {...props} />,
        }}
      />
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
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#8A2BE2',
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
