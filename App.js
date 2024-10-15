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

import TelaInicial from './Telas/TelaInicial';
import TelaAgendamentos from './Telas/TelaAgendamento';
import TelaServicos from './Telas/TelaServicos';
import TelaColaboradores from './Telas/TelaColaboradores';
import TelaGerenciar from './Telas/TelaGerenciar';
import TelaAtendimento from './Telas/TelaAtendimentos'; // Importa a tela de atendimento
import TelaAtendimentosConcluidos from './Telas/TelaAtendimentosConcluidos'; // Importa a nova tela

import {
  createTablesIfNeeded,
  getAppointments,
  checkTablesExist,
  initializeDefaultServices,
} from './database';
import { ThemeProvider, ThemeContext } from './Telas/tema';

// Desativa logs no ambiente de produção
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

function LogoTitle() {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.logoTitleContainer}>
        <Image source={require('./assets/icon.png')} style={styles.logo} />
        <Text style={styles.logoText}>IFPLANNER</Text>
      </View>
      <ToggleButton />
    </View>
  );
}

function AppNavigator({ appointments, setAppointments }) {
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
        <Stack.Screen
          name="Home"
          options={{ headerTitle: () => <LogoTitle /> }}
        >
          {(props) => (
            <TelaInicial
              {...props}
              appointments={appointments}
              setAppointments={setAppointments}
            />
          )}
        </Stack.Screen>
        <Stack.Screen
          name="AGENDAMENTO"
          options={{
            headerTitle: () => (
              <Text
                style={[styles.logoText, { color: '#9282FA', fontWeight: 'bold' }]}
              >
                AGENDAMENTO
              </Text>
            ),
            headerStyle: {
              backgroundColor: theme.headerBackground,
            },
            headerTintColor: theme.headerText,
          }}
        >
          {(props) => (
            <TelaAgendamentos
              {...props}
              appointments={appointments}
              setAppointments={setAppointments}
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
          component={TelaServicos}
          options={{
            headerTitle: 'Gerenciar Serviços',
          }}
        />
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
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await createTablesIfNeeded();
        await checkTablesExist(); // Verifica se as tabelas foram criadas

        // Inicializa os serviços padrão
        await initializeDefaultServices();
         // Reseta favoritos dos serviços

        // Agora que o banco de dados está pronto, podemos carregar os agendamentos
        const storedAppointments = await getAppointments();
        setAppointments(storedAppointments);

        setIsDbReady(true);
      } catch (error) {
        console.error('Erro ao inicializar o banco de dados:', error);
      }
    };
    initializeDatabase();
  }, []);

  const handleSetAppointments = useCallback((newAppointments) => {
    setAppointments(newAppointments);
  }, []);

  if (!isDbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Inicializando banco de dados...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AppNavigator
        appointments={appointments}
        setAppointments={handleSetAppointments}
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