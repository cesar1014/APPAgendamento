import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { ThemeContext } from './tema';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  deleteAllServices,
  deleteAllAppointments,
  deleteAllColaboradores,
} from '../database'
import Toast from 'react-native-toast-message';

import * as LocalAuthentication from 'expo-local-authentication';
export default function SettingsScreen({
  navigation,
  businessInfo,
  setBusinessInfo,
}) {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const [name, setName] = useState(businessInfo.name || '');
  const [phone, setPhone] = useState(businessInfo.phone || '');
  const [address, setAddress] = useState(businessInfo.address || '');
  const [logo, setLogo] = useState(businessInfo.logo || null);
  const [activityField, setActivityField] = useState(
    businessInfo.activityField || ''
  );
  const [errors, setErrors] = useState({});

  const validateInputs = () => {
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório.';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório.';
    } else if (!/^\d{10,11}$/.test(phone)) {
      newErrors.phone = 'Telefone inválido.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePickImage = async () => {
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
  
    if (
      !pickerResult.canceled &&
      pickerResult.assets &&
      pickerResult.assets.length > 0
    ) {
      setLogo(pickerResult.assets[0].uri);
    } else {
      Alert.alert('Nenhuma imagem foi selecionada.');
    }
  };

  

  const handleRemoveLogo = () => {
    setLogo(null);
  };

  const handleSave = async () => {
    if (!validateInputs()) {
      return;
    }

    const updatedInfo = {
      ...businessInfo,
      name,
      phone,
      address,
      logo,
      activityField,
    };

    setBusinessInfo(updatedInfo);
    await AsyncStorage.setItem('businessInfo', JSON.stringify(updatedInfo));
    navigation.goBack();
  };

  const handleResetApp = async () => {
    Alert.alert(
      'Resetar Aplicativo',
      'Todos os dados serão desprezados. Você tem certeza que deseja continuar?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Resetar',
          onPress: async () => {
            try {
              // Verificar se a autenticação local está disponível
              const isEnrolled = await LocalAuthentication.hasHardwareAsync();
              const hasBiometrics = await LocalAuthentication.isEnrolledAsync();
  
              if (isEnrolled && hasBiometrics) {
                // Solicitar autenticação
                const authResult = await LocalAuthentication.authenticateAsync({
                  promptMessage: 'Confirme sua identidade para resetar o aplicativo',
                  fallbackLabel: 'Use sua senha',
                  cancelLabel: 'Cancelar',
                });
  
                if (!authResult.success) {
                  // Usar Toast para exibir a falha na autenticação
                  Toast.show({
                    type: 'error',
                    text1: 'Autenticação Falhou',
                    text2: 'Não foi possível autenticar o usuário.',
                  });
                  return;
                }
              }
  
              // Limpar dados do AsyncStorage
              await AsyncStorage.clear();
  
              // Deletar todos os serviços, agendamentos e colaboradores
              await deleteAllServices();
              await deleteAllAppointments();
              await deleteAllColaboradores();
  
              // Resetar informações do negócio
              setBusinessInfo({});
              setName('');
              setPhone('');
              setAddress('');
              setLogo(null);
              setActivityField('');
  
              // Usar Toast para exibir sucesso
              Toast.show({
                type: 'success',
                text1: 'Sucesso',
                text2: 'O aplicativo foi resetado para as configurações iniciais.',
              });
            } catch (error) {
              // Usar Toast para exibir erro
              Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: 'Ocorreu um erro ao resetar o aplicativo.',
              });
              console.error('Erro ao resetar o aplicativo:', error);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };
  

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.card, color: theme.text },
          errors.name && styles.inputError,
        ]}
        placeholder="Nome do Estabelecimento *"
        placeholderTextColor={isDarkMode ? '#c7c7cc' : '#7c7c7c'}
        value={name}
 onChangeText={(text) => setName(text)}
      />
      {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.card, color: theme.text },
          errors.phone && styles.inputError,
        ]}
        placeholder="Telefone para contato *"
        placeholderTextColor={isDarkMode ? '#c7c7cc' : '#7c7c7c'}
        value={phone}
        onChangeText={(text) => setPhone(text.replace(/\D/g, ''))}
        keyboardType="phone-pad"
      />
      {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.card, color: theme.text },
        ]}
        placeholder="Endereço (opcional)"
        placeholderTextColor={isDarkMode ? '#c7c7cc' : '#7c7c7c'}
        value={address}
        onChangeText={setAddress}
      />

      <View style={styles.logoContainer}>
        {logo ? (
          <>
            <Image
              source={{ uri: logo }}
              style={styles.logoImage}
            />
            <TouchableOpacity
              style={[styles.logoButton, { backgroundColor: theme.card }]}
              onPress={handlePickImage}
            >
              <Text style={{ color: theme.text }}>Alterar Logotipo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.removeButton, { backgroundColor: '#FF6F61' }]}
              onPress={handleRemoveLogo}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                Remover Logotipo
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.logoButton, { backgroundColor: theme.card }]}
            onPress={handlePickImage}
          >
            <Text style={{ color: theme.text }}>
              Selecionar Logotipo (opcional)
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.card, color: theme.text },
        ]}
        placeholder="Ramo de atividade (opcional)"
        placeholderTextColor={isDarkMode ? '#c7c7cc' : '#7c7c7c'}
        value={activityField}
        onChangeText={setActivityField}
      />

      <TouchableOpacity
        onPress={handleSave}
        style={[styles.button, { backgroundColor: '#8A2BE2' }]}
      >
        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
          Salvar Alterações
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleResetApp}
        style={[styles.button, { backgroundColor: '#FF6F61' }]}
      >
        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
          Resetar para Configurações Iniciais
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
  input: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    height: 50,
  },
  inputError: {
    borderColor: '#FF6F61',
    borderWidth: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  logoButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: 10,
    borderRadius: 50,
  },
  removeButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});