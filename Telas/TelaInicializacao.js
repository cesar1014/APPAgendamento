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
} from '../database';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      alert('Nenhuma imagem foi selecionada.');
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
      navigation.navigate('Home');
    } catch (error) {
      console.error('Erro durante a configuração inicial:', error);
      Alert.alert(
        'Erro',
        'Ocorreu um erro durante a configuração inicial. Tente novamente.'
      );
    } finally {
      setLoading(false);
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
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.button, { backgroundColor: '#8A2BE2' }]}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
            Salvar e Continuar
          </Text>
        </TouchableOpacity>
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
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});
