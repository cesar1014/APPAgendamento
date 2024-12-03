import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { ThemeContext } from './tema';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateAppointmentText } from '../database';
import Toast from 'react-native-toast-message'; // Importando o Toast

export default function EditAppointmentTextScreen({ navigation }) {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const [customText, setCustomText] = useState(''); // Estado para o texto customizado

  // Texto padrão a ser usado como base
  const defaultText = 'Olá ${name}. Você possui agendado o serviço ${serviceDescription} às ${time} do dia ${formattedDate}.';

  // Carregar o texto customizado do agendamento quando a tela for aberta
  useEffect(() => {
    const loadCustomText = async () => {
      const storedText = await AsyncStorage.getItem('appointmentText');
      if (storedText) {
        setCustomText(storedText); // Se existir texto salvo, carrega ele
      } else {
        setCustomText(defaultText); // Se não houver, usa o texto padrão
      }
    };
    loadCustomText();
  }, []);

  // Função para salvar o texto customizado no AsyncStorage
  const handleSaveAppointmentText = async () => {
    if (!customText.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Texto do agendamento não pode ser vazio!',
      });
      return;
    }
  
    try {
      // Salvando o texto no AsyncStorage
      await AsyncStorage.setItem('appointmentText', customText.trim()); // Garanta que o texto esteja limpo de espaços desnecessários
      Toast.show({
        type: 'success',
        text1: 'Texto de agendamento salvo com sucesso!',
      });
      navigation.goBack(); // Volta para a tela anterior após salvar
    } catch (error) {
      console.error('Erro ao salvar o texto:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro ao salvar o texto.',
      });
    }
  };

  // Função para resetar o texto para o valor original
  const handleResetAppointmentText = () => {
    setCustomText(defaultText); // Reseta para o texto padrão
    Toast.show({
      type: 'info',
      text1: 'Texto resetado para o valor original.',
    });
  };

  // Função para cancelar a edição e voltar
  const handleCancelAppointmentText = () => {
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Editar Texto de Agendamento</Text>
      
      <TextInput
        style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
        multiline={true}
        placeholder="Digite o texto personalizado do agendamento"
        placeholderTextColor={isDarkMode ? '#c7c7cc' : '#7c7c7c'}
        value={customText} // Exibe o texto atual
        onChangeText={setCustomText} // Atualiza o estado com o novo texto
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#8A2BE2' }]}
          onPress={handleSaveAppointmentText} // Salva o texto personalizado
        >
          <Text style={styles.buttonText}>Salvar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#FF6F61' }]}
          onPress={handleCancelAppointmentText} // Cancela a edição
        >
          <Text style={styles.buttonText}>Cancelar</Text>
        </TouchableOpacity>

        {/* Novo botão para resetar o texto */}
        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: '#B0B0B0' }]} // Cor discreta
          onPress={handleResetAppointmentText} // Resetando o texto para o padrão
        >
          <Text style={styles.buttonText}>Resetar</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    height: 150,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    flexWrap: 'wrap',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '45%',
    marginBottom: 10,
  },
  resetButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%', 
    marginBottom: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
