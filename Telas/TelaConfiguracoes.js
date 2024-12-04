// SettingsScreen.js

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
  Platform,
} from 'react-native';
import { ThemeContext } from './tema'; // Certifique-se de que o caminho está correto
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  deleteAllServices,
  deleteAllAppointments,
  deleteAllColaboradores,
  createTablesIfNeeded,
  insertDefaultServices,
  exportDatabase,
  importDatabase,
} from '../database'; // Certifique-se de que o caminho está correto
import Toast from 'react-native-toast-message';

import * as LocalAuthentication from 'expo-local-authentication';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { StorageAccessFramework } from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons'; // Importando Ionicons para os ícones

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

  useEffect(() => {
    const initialize = async () => {
      try {
        await createTablesIfNeeded();
        if (activityField) {
          await insertDefaultServices(activityField);
        }
      } catch (error) {
        console.error('Erro ao inicializar o banco de dados:', error);
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: 'Erro ao inicializar o banco de dados.',
        });
      }
    };

    initialize();
  }, [activityField]);

  // Função para validar os inputs
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

  // Função para selecionar uma imagem
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

  // Função para remover o logotipo
  const handleRemoveLogo = () => {
    setLogo(null);
  };

  // Função para salvar as alterações
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
      isSetupComplete: true, // Supondo que o setup está completo após salvar
    };

    try {
      setBusinessInfo(updatedInfo);
      await AsyncStorage.setItem('businessInfo', JSON.stringify(updatedInfo));
      Toast.show({
        type: 'success',
        text1: 'Salvo',
        text2: 'Informações do negócio atualizadas com sucesso.',
      });
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao salvar informações:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Ocorreu um erro ao salvar as informações.',
      });
    }
  };

  // Função para resetar o aplicativo
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
              const isEnrolled = await LocalAuthentication.hasHardwareAsync();
              const hasBiometrics = await LocalAuthentication.isEnrolledAsync();

              if (isEnrolled && hasBiometrics) {
                const authOptions = {
                  promptMessage:
                    'Confirme sua identidade para resetar o aplicativo',
                  cancelLabel: 'Cancelar',
                };

                if (Platform.OS === 'android') {
                  authOptions.fallbackLabel = 'Use sua senha';
                }

                const authResult = await LocalAuthentication.authenticateAsync(authOptions);

                if (!authResult.success) {
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
                text2:
                  'O aplicativo foi resetado para as configurações iniciais.',
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

  // **Função de Backup Aprimorada com Opção de Salvar ou Compartilhar**
  const handleBackup = async () => {
    try {
      console.log('Iniciando processo de backup...');

      // Passo 1: Autenticação do usuário
      const isEnrolled = await LocalAuthentication.hasHardwareAsync();
      const hasBiometrics = await LocalAuthentication.isEnrolledAsync();
      console.log(`Hardware de autenticação disponível: ${isEnrolled}`);
      console.log(`Biometria configurada: ${hasBiometrics}`);

      if (isEnrolled && hasBiometrics) {
        const authOptions = {
          promptMessage: 'Autentique-se para criar um backup',
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

      // Passo 2: Coletar dados do AsyncStorage
      const storedBusinessInfo = await AsyncStorage.getItem('businessInfo');
      const appointmentText = await AsyncStorage.getItem('appointmentText');
      console.log('Dados coletados do AsyncStorage.');

      // Passo 3: Coletar dados do banco de dados usando exportDatabase
      let databaseData;
      try {
        databaseData = await exportDatabase();
        console.log('Dados do banco de dados exportados.');
      } catch (dbError) {
        console.error('Erro ao exportar banco de dados:', dbError);
        Toast.show({
          type: 'error',
          text1: 'Erro no Banco de Dados',
          text2: 'Ocorreu um erro ao exportar os dados do banco de dados.',
        });
        return;
      }

      // Passo 4: Incluir logotipo como Base64
      let logoBase64 = null;
      if (logo) {
        const fileInfo = await FileSystem.getInfoAsync(logo);
        console.log(`Logotipo existe: ${fileInfo.exists}`);

        if (fileInfo.exists) {
          try {
            const base64 = await FileSystem.readAsStringAsync(logo, {
              encoding: FileSystem.EncodingType.Base64,
            });
            console.log('Logotipo convertido para Base64.');

            // Determinar o tipo de imagem
            const fileExtension = logo.split('.').pop().toLowerCase();
            const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
            logoBase64 = `data:${mimeType};base64,${base64}`;
          } catch (logoError) {
            console.error('Erro ao converter logotipo para Base64:', logoError);
            Toast.show({
              type: 'error',
              text1: 'Erro no Logotipo',
              text2: 'Ocorreu um erro ao processar o logotipo.',
            });
            return;
          }
        }
      }

      // Passo 5: Criar objeto de backup com a estrutura correta
      const backupData = {
        businessInfo: JSON.parse(storedBusinessInfo || '{}'),
        appointmentText: appointmentText || '',
        database: databaseData, // Nessa propriedade, incluir todas as tabelas
        logo: logoBase64,
      };
      console.log('Objeto de backup criado.');

      // Passo 6: Converter para JSON
      let backupJson;
      try {
        backupJson = JSON.stringify(backupData, null, 2);
        console.log('Dados de backup convertidos para JSON.');
      } catch (jsonError) {
        console.error('Erro ao converter dados para JSON:', jsonError);
        Toast.show({
          type: 'error',
          text1: 'Erro no Backup',
          text2: 'Ocorreu um erro ao converter os dados para JSON.',
        });
        return;
      }

      // Passo 7: Perguntar ao usuário se deseja Salvar ou Compartilhar o backup
      Alert.alert(
        'Backup',
        'Deseja salvar ou compartilhar o backup?',
        [
          {
            text: 'Salvar',
            onPress: async () => {
              await salvarBackup(backupJson);
            },
          },
          {
            text: 'Compartilhar',
            onPress: async () => {
              await compartilharBackup(backupJson);
            },
          },
          {
            text: 'Cancelar',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro no Backup',
        text2: 'Ocorreu um erro ao criar o backup.',
      });
    }
  };

  // Função para salvar o backup
  const salvarBackup = async (backupJson) => {
    try {
      // Solicitar seleção de diretório ao usuário
      const directoryUri = await requestDirectoryPermission();
      if (!directoryUri) {
        return; // O usuário negou a permissão ou ocorreu um erro
      }

      // Criar o arquivo de backup no diretório selecionado usando StorageAccessFramework
      let backupFileUri;
      try {
        backupFileUri = await StorageAccessFramework.createFileAsync(
          directoryUri,
          `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
          'application/json'
        );
        console.log(`Arquivo de backup criado: ${backupFileUri}`);
      } catch (createError) {
        console.error('Erro ao criar o arquivo de backup:', createError);
        Toast.show({
          type: 'error',
          text1: 'Erro no Backup',
          text2: 'Ocorreu um erro ao criar o arquivo de backup.',
        });
        return;
      }

      // Escrever o conteúdo do backup no arquivo criado
      try {
        await FileSystem.writeAsStringAsync(backupFileUri, backupJson, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        console.log('Arquivo de backup salvo localmente.');
        Toast.show({
          type: 'success',
          text1: 'Backup Salvo',
          text2: `O backup foi salvo em ${backupFileUri}. Você pode acessá-lo através do gerenciador de arquivos.`,
        });
      } catch (writeError) {
        console.error('Erro ao salvar o arquivo de backup:', writeError);
        Toast.show({
          type: 'error',
          text1: 'Erro no Backup',
          text2: 'Ocorreu um erro ao salvar o arquivo de backup.',
        });
        return;
      }
    } catch (error) {
      console.error('Erro ao salvar backup:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro no Backup',
        text2: 'Ocorreu um erro ao salvar o backup.',
      });
    }
  };

  // Função para compartilhar o backup
  const compartilharBackup = async (backupJson) => {
    try {
      // Criar um arquivo temporário no diretório de cache
      const backupFileUri = FileSystem.cacheDirectory + `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      await FileSystem.writeAsStringAsync(backupFileUri, backupJson, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      console.log('Arquivo de backup criado para compartilhamento:', backupFileUri);

      // Compartilhar o arquivo usando Expo Sharing
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(backupFileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Compartilhar Backup',
          UTI: 'public.json',
        });
        Toast.show({
          type: 'success',
          text1: 'Backup Compartilhado',
          text2: 'O backup foi compartilhado com sucesso.',
        });
      } else {
        Toast.show({
          type: 'info',
          text1: 'Compartilhamento Não Disponível',
          text2: 'A funcionalidade de compartilhamento não está disponível neste dispositivo.',
        });
        console.log('API de compartilhamento não disponível.');
      }
    } catch (shareError) {
      console.error('Erro ao compartilhar backup:', shareError);
      Toast.show({
        type: 'error',
        text1: 'Erro no Compartilhamento',
        text2: 'Ocorreu um erro ao compartilhar o backup.',
      });
    }
  };

  // Função para solicitar permissão e selecionar diretório
  const requestDirectoryPermission = async () => {
    try {
      const permissionResponse = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissionResponse.granted) {
        return permissionResponse.directoryUri;
      } else {
        Alert.alert(
          'Permissão Negada',
          'Permissão para acessar o diretório é necessária para salvar o backup.'
        );
        return null;
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão para diretório:', error);
      Alert.alert(
        'Erro',
        'Ocorreu um erro ao solicitar permissão para acessar o diretório.'
      );
      return null;
    }
  };

  // Função de restauração
  const handleRestore = async () => {
    try {
      // Passo 1: Autenticação do usuário (se necessário)
      const isEnrolled = await LocalAuthentication.hasHardwareAsync();
      const hasBiometrics = await LocalAuthentication.isEnrolledAsync();
      console.log(`Hardware de autenticação disponível: ${isEnrolled}`);
      console.log(`Biometria configurada: ${hasBiometrics}`);

      if (isEnrolled && hasBiometrics) {
        const authOptions = {
          promptMessage: 'Autentique-se para restaurar o backup',
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
        type: 'application/json', // Restringir para arquivos JSON
        copyToCacheDirectory: true,
      });

      console.log('Resultado do DocumentPicker:', result); // Log para depuração

      // Verificar se o usuário não cancelou a seleção
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
          console.log('Conteúdo do backup:', backupJson); // Log para depuração
        } catch (readError) {
          console.error('Erro ao ler o arquivo de backup:', readError);
          Toast.show({
            type: 'error',
            text1: 'Erro na Restauração',
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
          'Confirmar Restauração',
          'Ao restaurar, todos os dados atuais serão sobrescritos. Deseja continuar?',
          [
            {
              text: 'Cancelar',
              style: 'cancel',
            },
            {
              text: 'Restaurar',
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
                  Alert.alert(
                    'Restauração Concluída',
                    'O aplicativo foi restaurado com sucesso. Você será redirecionado para a tela inicial.',
                    [
                      {
                        text: 'OK',
                        onPress: () => {
                          // Passo 11: Navegar de volta para a tela inicial
                          navigation.navigate('Home'); // **Substitua 'Home' pelo nome da sua tela inicial no seu navigator**
                          // Passo 12: Exibir toast de sucesso
                          Toast.show({
                            type: 'success',
                            text1: 'Restauração Concluída',
                            text2: 'O aplicativo foi restaurado a partir do backup.',
                          });
                        },
                      },
                    ],
                    { cancelable: false }
                  );
                } catch (error) {
                  console.error('Erro ao restaurar backup:', error);
                  Toast.show({
                    type: 'error',
                    text1: 'Erro na Restauração',
                    text2: 'Ocorreu um erro ao restaurar o backup.',
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
          text1: 'Restaurar Backup',
          text2: result.canceled ? 'Nenhum arquivo foi selecionado.' : 'Ocorreu um erro ao selecionar o arquivo de backup.',
        });
      }
    } catch (error) {
      console.error('Erro ao selecionar arquivo de backup:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro na Restauração',
        text2: 'Ocorreu um erro ao selecionar o arquivo de backup.',
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
      {/* Campo para Nome do Estabelecimento */}
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

      {/* Campo para Telefone */}
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

      {/* Campo para Endereço */}
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

      {/* Seção para Logotipo */}
      <View style={styles.logoContainer}>
        {logo ? (
          <>
            <Image source={{ uri: logo }} style={styles.logoImage} />
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

      {/* Campo para Ramo de Atividade */}
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

      {/* Container para Botões de Backup e Restore Lado a Lado */}
      <View style={styles.backupRestoreContainer}>
        {/* Botão de Fazer Backup */}
        <TouchableOpacity
          onPress={handleBackup}
          style={[
            styles.backupRestoreButton,
            { backgroundColor: '#333333' }, // Fundo cinza escuro
          ]}
        >
          <Ionicons name="cloud-download" size={24} color="#FFFFFF" />
          <Text style={[styles.backupRestoreButtonText, { color: '#FFFFFF' }]}>
            Fazer Backup
          </Text>
        </TouchableOpacity>

        {/* Botão de Restaurar Backup */}
        <TouchableOpacity
          onPress={handleRestore}
          style={[
            styles.backupRestoreButton,
            { backgroundColor: '#333333', marginLeft: 10 }, // Fundo cinza escuro com margem à esquerda
          ]}
        >
          <Ionicons name="cloud-upload" size={24} color="#FFFFFF" />
          <Text style={[styles.backupRestoreButtonText, { color: '#FFFFFF' }]}>
            Restaurar Backup
          </Text>
        </TouchableOpacity>
      </View>

      {/* Botão para Salvar Alterações */}
      <TouchableOpacity
        onPress={handleSave}
        style={[styles.button, { backgroundColor: '#8A2BE2' }]} // Cor roxa
      >
        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
          Salvar Alterações
        </Text>
      </TouchableOpacity>

      {/* Botão para Resetar o Aplicativo */}
      <TouchableOpacity
        onPress={handleResetApp}
        style={[styles.button, { backgroundColor: '#FF6F61' }]} // Cor vermelha
      >
        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
          Resetar para Configurações Iniciais
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
} // Fechar a função do componente

// Definição dos estilos
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
  backupRestoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backupRestoreButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
  },
  backupRestoreButtonText: {
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 16,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});
