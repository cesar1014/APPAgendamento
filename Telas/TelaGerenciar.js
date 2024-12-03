import React, { useContext } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ThemeContext } from './tema';

export default function TelaGerenciar({ navigation }) {
  const { theme } = useContext(ThemeContext);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#8A2BE2' }]}
        onPress={() => navigation.navigate('SERVIÇOS')}
      >
        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
          Gerenciar Serviços
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#8A2BE2', marginTop: 20 }]}
        onPress={() => navigation.navigate('COLABORADORES')}
      >
        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
          Gerenciar Colaboradores
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#8A2BE2', marginTop: 20 }]}
        onPress={() => navigation.navigate('ATENDIMENTOS_CONCLUIDOS')}
      >
        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
          Atendimentos Concluídos
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#8A2BE2', marginTop: 20 }]}
        onPress={() => navigation.navigate('CLIENTES_ATENDIDOS')}
      >
        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
          Clientes Atendidos
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#8A2BE2', marginTop: 20 }]}
        onPress={() => navigation.navigate('EditAppointmentTextScreen')}
      >
        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
        Texto de Agendamento
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  button: {
    padding: 15,
    alignItems: 'center',
    borderRadius: 8,
    width: '80%',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
