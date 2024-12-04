// InitialSetupScreen.js

import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ThemeContext } from './tema';
import * as ImagePicker from 'expo-image-picker';
import {
  insertDefaultServices,
  getActivityFieldByName,
  getAllActivityFields,
  importDatabase, // Certifique-se de que esta função está corretamente implementada
  exportDatabase, // Se necessário
} from '../database';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Toast from 'react-native-toast-message';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Sharing from 'expo-sharing';
import { StorageAccessFramework } from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';

export default function InitialSetupScreen({ navigation, setBusinessInfo }) {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [logo, setLogo] = useState(null);
  const [activityField, setActivityField] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [activityFields, setActivityFields] = useState([]);

  useEffect(() => {
    const loadActivityFields = async () => {
      try {
        const fields = await getAllActivityFields();
        setActivityFields(fields.map((field) => field.name));
      } catch (error) {
        console.error('Erro ao carregar ramos de atividade:', error);
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: 'Erro ao carregar ramos de atividade.',
        });
      }
    };

    loadActivityFields();
  }, []);

  const validateInputs = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Nome é obrigatório.';
    if (!phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório.';
    } else if (!/^\d{10,11}$/.test(phone)) {
      newErrors.phone = 'Telefone inválido.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePickImage = async () => {
    try {
      // Solicitar permissões de mídia
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Negada',
          'Permissão para acessar a galeria é necessária!'
        );
        return;
      }

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
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Ocorreu um erro ao selecionar a imagem.',
      });
    }
  };

  // Função para remover a imagem selecionada
  const handleRemoveImage = () => {
    setLogo(null);
  };

  const handleSave = async () => {
    if (!validateInputs()) {
      return;
    }

    setLoading(true);

    try {
      let activityFieldId = null;
      if (activityField) {
        // Obter o ID do ramo de atividade
        const sectorData = await getActivityFieldByName(activityField);
        if (sectorData) {
          activityFieldId = sectorData.id;

          // Inserir serviços predefinidos apenas para o ramo selecionado
          await insertDefaultServices(activityField);
        }
      }

      const info = {
        name,
        phone,
        address,
        logo,
        activityField,
        activityFieldId,
        isSetupComplete: true,
      };

      await AsyncStorage.setItem('businessInfo', JSON.stringify(info));
      setBusinessInfo(info);
      Toast.show({
        type: 'success',
        text1: 'Configuração Completa',
        text2: 'Informações salvas com sucesso.',
      });
      navigation.navigate('Home');
    } catch (error) {
      console.error('Erro durante a configuração inicial:', error);
      Alert.alert(
        'Erro',
        'Ocorreu um erro durante a configuração inicial. Tente novamente.'
      );
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Ocorreu um erro durante a configuração inicial.',
      });
    } finally {
      setLoading(false);
    }
  };

  // **Função para Importar Backup**
  const handleImportBackup = async () => {
    try {
      // Passo 1: Autenticação do usuário (opcional)
      const isEnrolled = await LocalAuthentication.hasHardwareAsync();
      const hasBiometrics = await LocalAuthentication.isEnrolledAsync();

      if (isEnrolled && hasBiometrics) {
        const authOptions = {
          promptMessage: 'Autentique-se para importar o backup',
          cancelLabel: 'Cancelar',
        };

        if (Platform.OS === 'android') {
          authOptions.fallbackLabel = 'Use sua senha';
        }

        const authResult = await LocalAuthentication.authenticateAsync(authOptions);
        console.log('Resultado da autenticação:', authResult);

        if (!authResult.success) {
          Toast.show({
            type: 'error',
            text1: 'Autenticação Falhou',
            text2: 'Não foi possível autenticar o usuário.',
          });
          return;
        }
      }

      // Passo 2: Selecionar arquivo de backup
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      console.log('Resultado do DocumentPicker:', result);

      if (!result.canceled) {
        const asset = result.assets[0];
        const { uri, name, size } = asset;
        console.log(`Arquivo selecionado: ${name}, URI: ${uri}, Tamanho: ${size} bytes`);

        // Passo 3: Ler o arquivo de backup
        let backupJson;
        try {
          backupJson = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.UTF8,
          });
          console.log('Conteúdo do backup:', backupJson);
        } catch (readError) {
          console.error('Erro ao ler o arquivo de backup:', readError);
          Toast.show({
            type: 'error',
            text1: 'Erro na Importação',
            text2: 'Ocorreu um erro ao ler o arquivo de backup.',
          });
          return;
        }

        let backupData;
        try {
          backupData = JSON.parse(backupJson);
          console.log('Dados do backup parseados:', backupData);
        } catch (parseError) {
          console.error('Erro ao parsear o backup:', parseError);
          Toast.show({
            type: 'error',
            text1: 'Backup Inválido',
            text2: 'O arquivo selecionado não é um backup válido.',
          });
          return;
        }

        // Passo 4: Validar a estrutura dos dados de backup
        if (
          !backupData.database ||
          !backupData.database.activityFields ||
          !backupData.database.services ||
          !backupData.database.colaboradores ||
          !backupData.database.serviceColaboradores ||
          !backupData.database.appointments ||
          !backupData.database.atendimentos
        ) {
          console.error('Estrutura do backup inválida:', backupData);
          Toast.show({
            type: 'error',
            text1: 'Backup Inválido',
            text2: 'O arquivo de backup está incompleto ou corrompido.',
          });
          return;
        }

        // Passo 5: Confirmar restauração
        Alert.alert(
          'Confirmar Importação',
          'Ao importar, todos os dados atuais serão sobrescritos. Deseja continuar?',
          [
            {
              text: 'Cancelar',
              style: 'cancel',
            },
            {
              text: 'Importar',
              onPress: async () => {
                try {
                  // Passo 6: Limpar dados existentes
                  await AsyncStorage.clear();
                  console.log('AsyncStorage limpo.');

                  // Passo 7: Importar dados no banco de dados
                  await importDatabase(backupData.database);
                  console.log('Banco de dados restaurado com sucesso.');

                  // Passo 8: Atualizar o estado do aplicativo
                  setBusinessInfo(backupData.businessInfo || {});
                  console.log('Estado do negócio atualizado.');

                  // Passo 9: Atualizar logotipo (se aplicável)
                  if (backupData.businessInfo && backupData.businessInfo.logo) {
                    setLogo(backupData.businessInfo.logo);
                  } else {
                    setLogo(null);
                  }

                  // Passo 10: Exibir mensagem de sucesso e navegar
                  Toast.show({
                    type: 'success',
                    text1: 'Importação Concluída',
                    text2: 'O backup foi importado com sucesso.',
                  });
                  navigation.navigate('Home');
                } catch (error) {
                  console.error('Erro ao importar backup:', error);
                  Toast.show({
                    type: 'error',
                    text1: 'Erro na Importação',
                    text2: 'Ocorreu um erro ao importar o backup.',
                  });
                }
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        // O usuário cancelou a seleção do arquivo ou ocorreu algum problema
        console.log('O usuário cancelou a seleção do arquivo ou ocorreu um problema:', result.canceled);
        Toast.show({
          type: 'info',
          text1: 'Importar Backup',
          text2: result.canceled ? 'Nenhum arquivo foi selecionado.' : 'Ocorreu um erro ao selecionar o arquivo de backup.',
        });
      }
    } catch (error) {
      console.error('Erro ao importar backup:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro na Importação',
        text2: 'Ocorreu um erro ao importar o backup.',
      });
    }
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
        onChangeText={setName}
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

      <TouchableOpacity
        style={[styles.logoButton, { backgroundColor: theme.card }]}
        onPress={handlePickImage}
      >
        <Text style={{ color: theme.text }}>
          {logo ? 'Alterar Logotipo' : 'Selecionar Logotipo (opcional)'}
        </Text>
      </TouchableOpacity>

      {logo && (
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: logo }}
            style={styles.logoImage}
          />
          <TouchableOpacity
            style={[styles.removeButton, { backgroundColor: '#FF6F61' }]}
            onPress={handleRemoveImage}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
              Remover Imagem
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={[styles.label, { color: theme.text }]}>
        Selecione o Ramo de Atividade (opcional)
      </Text>
      <View
        style={[
          styles.pickerContainer,
          { backgroundColor: theme.card },
          errors.activityField && styles.inputError,
        ]}
      >
        <Picker
          selectedValue={activityField}
          style={{ color: theme.text }}
          onValueChange={(itemValue) => setActivityField(itemValue)}
        >
          <Picker.Item label="-- Selecione --" value="" />
          {activityFields.map((field) => (
            <Picker.Item key={field} label={field} value={field} />
          ))}
        </Picker>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#8A2BE2"
          style={{ marginTop: 20 }}
        />
      ) : (
        <>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.button, { backgroundColor: '#8A2BE2' }]}
          >
            <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
              Salvar e Continuar
            </Text>
          </TouchableOpacity>

          {/* Botão para Importar Backup */}
          <TouchableOpacity
            onPress={handleImportBackup}
            style={[styles.importButton, { backgroundColor: '#1E90FF' }]} // Azul para diferenciar
          >
            <Ionicons name="download-outline" size={24} color="#FFFFFF" />
            <Text style={[styles.importButtonText, { color: '#FFFFFF' }]}>
              Importar Backup
            </Text>
          </TouchableOpacity>
        </>
      )}
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
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  pickerContainer: {
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
  },
  logoButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 15,
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
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    justifyContent: 'center',
  },
  importButtonText: {
    marginLeft: 10,
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});
