import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', // Centraliza verticalmente
    alignItems: 'center', // Centraliza horizontalmente
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
