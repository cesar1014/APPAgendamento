import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemeContext } from './tema';

export default function WelcomeScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Bem-vindo ao IFPLANNER!</Text>
      <Text style={[styles.subtitle, { color: theme.text }]}>
        Obrigado por escolher nosso aplicativo.
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#8A2BE2' }]}
        onPress={() => navigation.navigate('QuickTour')}
      >
        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Continuar</Text>
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
  title: {
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18, 
    textAlign: 'center', 
    marginBottom: 40,
  },
  button: {
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center',
    width: '80%',
  },
  buttonText: {
    fontSize: 16, 
    fontWeight: 'bold',
  },
});
