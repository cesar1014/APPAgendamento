import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ThemeContext } from './tema';

export default function QuickTourScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);
  const [step, setStep] = useState(0);

  const tourSteps = [
    {
      title: 'Agendamentos',
      description: 'Gerencie seus agendamentos de forma fácil e rápida.',
    },
    {
      title: 'Serviços',
      description: 'Adicione e personalize os serviços oferecidos.',
    },
    {
      title: 'Colaboradores',
      description: 'Gerencie sua equipe e associe serviços a colaboradores.',
    },
    {
      title: 'Configurações',
      description: 'Personalize o aplicativo conforme suas preferências.',
    },
  ];

  const handleNext = () => {
    if (step < tourSteps.length - 1) {
      setStep(step + 1);
    } else {
      navigation.navigate('InitialSetup');
    }
  };

  const handleSkip = () => {
    navigation.navigate('InitialSetup');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>
          {tourSteps[step].title}
        </Text>
        <Text style={[styles.description, { color: theme.text }]}>
          {tourSteps[step].description}
        </Text>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={[styles.skipText, { color: theme.text }]}>Pular</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#8A2BE2' }]}
          onPress={handleNext}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
            {step < tourSteps.length - 1 ? 'Próximo' : 'Concluir'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
  },
  content: {
    flexGrow: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20,
  },
  title: {
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20,
  },
  description: {
    fontSize: 18, 
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 20,
  },
  skipText: {
    fontSize: 16, 
  },
  button: {
    padding: 10, 
    borderRadius: 8, 
    alignItems: 'center',
    width: 100,
  },
  buttonText: {
    fontSize: 16, 
    fontWeight: 'bold',
  },
});
